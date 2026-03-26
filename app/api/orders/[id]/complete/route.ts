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
        { error: '您不是跑手，无法完成订单' },
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

    // 验证订单状态是否为 ACCEPTED
    if (order.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: `订单状态为 ${order.status}，无法完成` },
        { status: 400 }
      );
    }

    // 使用事务更新订单状态和跑手统计
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新订单状态为 COMPLETED
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
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

      // 2. 更新跑手的订单数和状态（从 BUSY 改回 ONLINE）
      await tx.runnerProfile.update({
        where: { id: runner.id },
        data: {
          ordersCount: {
            increment: 1,
          },
          status: 'ONLINE',
        },
      });

      return updatedOrder;
    });

    // 发送通知给老板（fire-and-forget，不影响主流程）
    createNotification({
      type: 'ORDER_COMPLETED',
      userId: result.userId,
      actorId: payload.userId,
      orderId: params.id,
      title: '订单已完成',
      message: `跑手 ${runner.nickname} 已完成您的订单，请及时确认并评价`,
    }).catch(() => { /* 忽略通知失败 */ });

    return NextResponse.json({
      success: true,
      message: '订单已完成',
      order: result,
    });
  } catch (error) {
    console.error('完成订单失败:', error);
    return NextResponse.json(
      { error: '完成订单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
