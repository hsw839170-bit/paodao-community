import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

/**
 * PUT /api/orders/[id]/progress
 * 跑手更新订单进度
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
    const { progress, note } = body;

    // 验证进度值
    if (progress === undefined || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: '进度必须在 0-100 之间' },
        { status: 400 }
      );
    }

    // 查找订单
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        runner: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 验证是接单的跑手
    if (order.runner.userId !== payload.userId) {
      return NextResponse.json(
        { error: '无权更新此订单' },
        { status: 403 }
      );
    }

    // 验证订单状态
    if (order.status !== 'ACCEPTED' && order.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: '订单状态不允许更新进度' },
        { status: 400 }
      );
    }

    // 更新订单进度
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. 更新订单
      const updated = await tx.order.update({
        where: { id: params.id },
        data: {
          progress,
          progressNote: note || null,
          status: progress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        },
      });

      // 2. 创建日志
      await tx.orderLog.create({
        data: {
          orderId: params.id,
          actorType: 'RUNNER',
          actorId: payload.userId,
          action: 'UPDATE_PROGRESS',
          message: note || `更新进度至 ${progress}%`,
          progressFrom: order.progress,
          progressTo: progress,
        },
      });

      // 3. 如果进度达到 100%，创建完成日志
      if (progress === 100) {
        await tx.orderLog.create({
          data: {
            orderId: params.id,
            actorType: 'RUNNER',
            actorId: payload.userId,
            action: 'COMPLETE',
            message: '订单已完成',
            progressFrom: order.progress,
            progressTo: 100,
          },
        });

        // 更新跑手订单数
        await tx.runnerProfile.update({
          where: { id: order.runnerId },
          data: {
            ordersCount: { increment: 1 },
            status: 'ONLINE',
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: progress === 100 ? '订单已完成' : '进度更新成功',
      order: updatedOrder,
    });

  } catch (error) {
    console.error('更新进度失败:', error);
    return NextResponse.json(
      { error: '更新进度失败，请稍后重试' },
      { status: 500 }
    );
  }
}
