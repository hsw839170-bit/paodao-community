import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户登录
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    // 获取当前跑手的资料
    const runner = await prisma.runnerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!runner) {
      return NextResponse.json(
        { error: '您不是跑手，无法接单' },
        { status: 403 }
      );
    }

    // 获取订单
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 验证订单是否属于当前跑手
    if (order.runnerId !== runner.id) {
      return NextResponse.json(
        { error: '您无权操作此订单' },
        { status: 403 }
      );
    }

    // 验证订单状态是否为 PENDING
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: `订单状态为 ${order.status}，无法接单` },
        { status: 400 }
      );
    }

    // 更新订单状态为 ACCEPTED，并创建日志
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: params.id },
        data: {
          status: 'ACCEPTED',
          progress: 10,
          progressNote: '已接单，准备开始',
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
            },
          },
        },
      });

      // 创建接单日志
      await tx.orderLog.create({
        data: {
          orderId: params.id,
          actorType: 'RUNNER',
          actorId: payload.userId,
          action: 'ACCEPT',
          message: '跑手已接单',
          progressFrom: 0,
          progressTo: 10,
        },
      });

      // 更新跑手状态为 BUSY
      await tx.runnerProfile.update({
        where: { id: runner.id },
        data: { status: 'BUSY' },
      });

      return updated;
    });

    // 发送通知给老板（fire-and-forget，不影响主流程）
    createNotification({
      type: 'ORDER_ACCEPTED',
      userId: updatedOrder.userId,
      actorId: payload.userId,
      orderId: params.id,
      title: '跑手已接单',
      message: `跑手 ${runner.nickname} 已接受您的订单，即将开始服务`,
    }).catch(() => { /* 忽略通知失败 */ });

    return NextResponse.json({
      success: true,
      message: '接单成功',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('接单失败:', error);
    return NextResponse.json(
      { error: '接单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
