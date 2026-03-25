import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

/**
 * GET /api/orders/[id]/logs
 * 获取订单日志/轨迹
 */
export async function GET(
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

    // 查找订单
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true } },
        runner: { select: { userId: true } },
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
    const isRunner = order.runner.userId === payload.userId;

    if (!isOwner && !isRunner) {
      return NextResponse.json(
        { error: '无权查看此订单' },
        { status: 403 }
      );
    }

    // 获取订单日志
    const logs = await prisma.orderLog.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      logs,
    });

  } catch (error) {
    console.error('获取订单日志失败:', error);
    return NextResponse.json(
      { error: '获取订单日志失败，请稍后重试' },
      { status: 500 }
    );
  }
}
