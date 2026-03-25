import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { acquireLock, releaseLock } from '@/lib/redis-lock';

/**
 * PUT /api/orders/[id]/claim
 * 抢单（仅 PUBLIC 模式订单）
 * 
 * 流程:
 * 1. 验证登录 & 跑手身份
 * 2. 查询订单状态
 * 3. 获取 Redis 分布式锁
 * 4. 双重检查订单状态
 * 5. 更新订单（runnerId + status: ACCEPTED + claimedAt）
 * 6. 释放锁
 * 7. 返回成功
 * 
 * 并发保护:
 * - Redis 分布式锁（key: order:claim:<id>）
 * - 数据库事务更新（乐观锁）
 * - 锁超时: 10 秒
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  const lockKey = `order:claim:${orderId}`;
  
  try {
    // 1. 验证登录
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const payload = verifyToken(token);

    // 2. 获取跑手资料
    const runner = await prisma.runnerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!runner) {
      return NextResponse.json(
        { error: '您不是跑手，无法抢单' },
        { status: 403 }
      );
    }

    // 检查跑手状态
    if (runner.status === 'OFFLINE') {
      return NextResponse.json(
        { error: '您当前处于离线状态，请先上线' },
        { status: 400 }
      );
    }

    // 3. 查询订单
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 校验订单类型
    if (order.mode !== 'PUBLIC') {
      return NextResponse.json(
        { error: '该订单不是公开发布订单' },
        { status: 400 }
      );
    }

    // 校验订单状态
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: '订单已被抢或已取消' },
        { status: 409 }
      );
    }

    // 校验是否过期
    if (order.claimDeadline && order.claimDeadline < new Date()) {
      return NextResponse.json(
        { error: '订单已过期' },
        { status: 400 }
      );
    }

    // 4. 获取分布式锁
    const lockAcquired = await acquireLock(lockKey, runner.id, 10);
    
    if (!lockAcquired) {
      // 可能是其他跑手正在抢单，或锁未过期
      return NextResponse.json(
        { error: '抢单失败，请重试' },
        { status: 429 }
      );
    }

    try {
      // 5. 双重检查订单状态（在锁内再次确认）
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, runnerId: true },
      });

      if (currentOrder?.status !== 'PENDING' || currentOrder?.runnerId) {
        return NextResponse.json(
          { error: '订单已被其他跑手抢走' },
          { status: 409 }
        );
      }

      // 6. 更新订单（使用事务保证原子性）
      const updatedOrder = await prisma.order.update({
        where: { 
          id: orderId,
          status: 'PENDING', // 乐观锁条件
        },
        data: {
          runnerId: runner.id,
          status: 'ACCEPTED',
          claimedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, phone: true },
          },
          runner: {
            select: { id: true, nickname: true },
          },
        },
      });

      // 7. 创建订单日志
      await prisma.orderLog.create({
        data: {
          orderId,
          actorType: 'RUNNER',
          actorId: runner.id,
          action: 'CLAIM',
          message: `跑手 ${runner.nickname} 抢单成功`,
        },
      });

      // TODO: 发送通知给下单用户（WebSocket 或短信）
      // await notifyUser(order.userId, `您的订单已被 ${runner.nickname} 接单`);

      return NextResponse.json({
        success: true,
        message: '抢单成功',
        order: updatedOrder,
      });

    } finally {
      // 8. 释放锁
      await releaseLock(lockKey, runner.id);
    }

  } catch (error) {
    console.error('抢单失败:', error);
    
    // 确保锁被释放（即使出错）
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader ? extractTokenFromHeader(authHeader) : null;
      if (token) {
        const payload = verifyToken(token);
        const runner = await prisma.runnerProfile.findUnique({
          where: { userId: payload.userId },
        });
        if (runner) {
          await releaseLock(lockKey, runner.id);
        }
      }
    } catch (e) {
      // 忽略释放锁的错误
    }

    return NextResponse.json(
      { error: '抢单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
