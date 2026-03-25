import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

/**
 * POST /api/orders/claim
 * 抢单接口（公开订单模式）
 * 
 * TODO: 生产环境需要实现并发控制
 * TODO: 建议使用 Redis 分布式锁防止重复抢单
 * TODO: 或使用数据库事务 + 唯一约束实现乐观锁
 * 
 * Body:
 * - orderId: 订单 ID
 * 
 * 并发控制方案（待实现）：
 * 1. Redis 分布式锁：SET order:claim:{orderId} {runnerId} NX EX 10
 * 2. 数据库乐观锁：使用 version 字段或状态检查
 * 3. 数据库事务：使用 repeatable read 隔离级别
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证登录状态
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const runnerUserId = payload.userId;

    // 2. 获取请求体
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: '缺少订单 ID' },
        { status: 400 }
      );
    }

    // 3. 验证用户是跑手身份
    const runnerProfile = await prisma.runnerProfile.findUnique({
      where: { userId: runnerUserId },
      select: { id: true, status: true }
    });

    if (!runnerProfile) {
      return NextResponse.json(
        { success: false, error: '您不是跑手，无法抢单' },
        { status: 403 }
      );
    }

    // 4. 检查订单是否可抢
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        mode: true,
        claimDeadline: true,
        runnerId: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: '订单不存在' },
        { status: 404 }
      );
    }

    // 5. 验证订单状态
    if (order.mode !== 'PUBLIC') {
      return NextResponse.json(
        { success: false, error: '该订单不是公开抢单模式' },
        { status: 400 }
      );
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: '该订单已被接单或已取消' },
        { status: 409 }
      );
    }

    if (order.claimDeadline && order.claimDeadline < new Date()) {
      return NextResponse.json(
        { success: false, error: '该订单已过期' },
        { status: 409 }
      );
    }

    // 6. TODO: 并发控制（关键！）
    // ============================================================
    // 方案 A: Redis 分布式锁（推荐）
    // const lockKey = `order:claim:${orderId}`;
    // const lock = await redis.set(lockKey, runnerProfile.id, 'NX', 'EX', 10);
    // if (!lock) {
    //   return NextResponse.json(
    //     { success: false, error: '该订单正在被其他跑手抢单，请重试' },
    //     { status: 409 }
    //   );
    // }
    //
    // 方案 B: 数据库乐观锁
    // 需要在 Order 模型添加 version 字段
    //
    // 方案 C: 数据库事务 + 状态检查
    // 使用 $transaction 包裹更新操作，确保原子性
    // ============================================================

    // 7. 更新订单状态（抢单成功）
    // TODO: 需要添加并发控制后再启用此逻辑
    /*
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 再次检查订单状态（防止并发问题）
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true }
      });
      
      if (currentOrder?.status !== 'PENDING') {
        throw new Error('ORDER_ALREADY_CLAIMED');
      }
      
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'ACCEPTED',
          runnerId: runnerProfile.id,
          claimedBy: runnerProfile.id
        }
      });
    });
    */

    // 8. 返回成功响应（当前为 stub 模式）
    return NextResponse.json({
      success: true,
      message: '抢单接口已就绪（并发控制待实现）',
      data: {
        orderId,
        runnerId: runnerProfile.id,
        // 实际实现后返回：claimedAt: updatedOrder.updatedAt
      },
      todo: [
        '需要配置 REDIS_URL 以启用分布式锁',
        '需要实现并发控制逻辑',
        '需要添加数据库事务'
      ]
    });

  } catch (error: any) {
    console.error('抢单失败:', error);
    
    if (error.message === 'ORDER_ALREADY_CLAIMED') {
      return NextResponse.json(
        { success: false, error: '该订单已被其他跑手抢走' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: '抢单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
