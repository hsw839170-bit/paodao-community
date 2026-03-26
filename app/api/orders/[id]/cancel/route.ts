import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

/**
 * PUT /api/orders/[id]/cancel
 * 取消订单（仅 PENDING 状态可取消）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const body = await request.json();
    const { reason } = body;

    // 查找订单
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        runner: true,
        user: { select: { id: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 验证权限（下单用户或接单跑手）
    const isOwner = order.user.id === payload.userId;
    const isRunner = order.runner?.userId === payload.userId;

    if (!isOwner && !isRunner) {
      return NextResponse.json(
        { error: '无权取消此订单' },
        { status: 403 }
      );
    }

    // 验证订单状态（仅 PENDING 可取消）
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: `订单状态为 ${order.status}，无法取消` },
        { status: 400 }
      );
    }

    // 取消订单
    const canceledOrder = await prisma.$transaction(async (tx) => {
      // 1. 更新订单状态
      const updated = await tx.order.update({
        where: { id: params.id },
        data: {
          status: 'CANCELED',
        },
      });

      // 2. 创建取消日志
      await tx.orderLog.create({
        data: {
          orderId: params.id,
          actorType: isOwner ? 'BOSS' : 'RUNNER',
          actorId: payload.userId,
          action: 'CANCEL',
          message: reason || (isOwner ? '老板取消订单' : '跑手取消订单'),
        },
      });

      return updated;
    });

    // 发送通知给对方（fire-and-forget，不影响主流程）
    if (isOwner && order.runner) {
      // 老板取消 → 通知跑手
      createNotification({
        type: 'ORDER_CANCELLED',
        userId: order.runner.userId,
        actorId: payload.userId,
        orderId: params.id,
        title: '订单已取消',
        message: `老板取消了订单，原因：${reason || '无'}`,
      }).catch(() => { /* 忽略通知失败 */ });
    } else if (!isOwner) {
      // 跑手取消 → 通知老板
      createNotification({
        type: 'ORDER_CANCELLED',
        userId: order.user.id,
        actorId: payload.userId,
        orderId: params.id,
        title: '订单已取消',
        message: `跑手取消了订单，原因：${reason || '无'}`,
      }).catch(() => { /* 忽略通知失败 */ });
    }

    return NextResponse.json({
      success: true,
      message: '订单已取消',
      order: canceledOrder,
    });

  } catch (error) {
    console.error('取消订单失败:', error);
    return NextResponse.json(
      { error: '取消订单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
