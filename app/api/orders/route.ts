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

    // 获取订单列表
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      userId: payload.userId,
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
        runner: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
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
      where: { userId: payload.userId },
      _count: {
        status: true,
      },
    });

    const statsMap = stats.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      count: orders.length,
      stats: statsMap,
      orders,
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json(
      { error: '获取订单列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}
