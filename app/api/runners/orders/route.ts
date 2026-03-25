import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
        { error: '您不是跑手，无法查看订单' },
        { status: 403 }
      );
    }

    // 获取所有状态的订单数量（用于调试）
    const allOrdersCount = await prisma.order.count({
      where: { runnerId: runner.id },
    });

    // 获取订单列表（支持状态筛选）
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      runnerId: runner.id,
    };

    if (status && ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELED'].includes(status)) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
    });

    // 统计各状态订单数量
    const stats = await prisma.order.groupBy({
      by: ['status'],
      where: { runnerId: runner.id },
      _count: {
        status: true,
      },
    });

    const statsMap = stats.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    // 调试信息
    const debug = {
      runnerId: runner.id,
      userId: payload.userId,
      totalOrdersInDB: allOrdersCount,
      filteredOrders: orders.length,
      queryStatus: status || 'ALL',
    };

    return NextResponse.json({
      success: true,
      runner: {
        id: runner.id,
        nickname: runner.nickname,
      },
      count: orders.length,
      stats: statsMap,
      orders,
      debug,  // 包含调试信息
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json(
      { error: '获取订单列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}
