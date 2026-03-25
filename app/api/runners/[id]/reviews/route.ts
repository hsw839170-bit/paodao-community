import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/runners/[id]/reviews
 * 获取跑手评价列表
 * 
 * 注意：返回的用户信息已脱敏，不包含手机号
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取评价列表（最新 20 条）
    const reviews = await prisma.review.findMany({
      where: { runnerId: params.id },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            // phone 已移除，避免泄露用户隐私
          },
        },
        order: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    // 获取统计信息
    const stats = await prisma.review.aggregate({
      where: { runnerId: params.id },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    // 获取评分分布
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { runnerId: params.id },
      _count: {
        rating: true,
      },
    });

    const distributionMap = [5, 4, 3, 2, 1].map((star) => {
      const item = distribution.find((d) => d.rating === star);
      return {
        star,
        count: item?._count.rating || 0,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        average: Math.round((stats._avg.rating || 0) * 10) / 10,
        total: stats._count.id,
      },
      distribution: distributionMap,
      reviews,
    });
  } catch (error) {
    console.error('获取评价失败:', error);
    return NextResponse.json(
      { error: '获取评价失败，请稍后重试' },
      { status: 500 }
    );
  }
}
