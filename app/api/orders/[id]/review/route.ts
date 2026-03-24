import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function POST(
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

    // 获取订单
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 验证当前用户是下单方（BOSS）
    if (order.userId !== payload.userId) {
      return NextResponse.json(
        { error: '只有下单方可以评价' },
        { status: 403 }
      );
    }

    // 验证订单状态为 COMPLETED
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: '订单未完成，无法评价' },
        { status: 400 }
      );
    }

    // 验证是否已评价
    if (order.review) {
      return NextResponse.json(
        { error: '您已评价过该订单' },
        { status: 400 }
      );
    }

    // 获取评价内容
    const body = await request.json();
    const { rating, comment } = body;

    // 验证评分
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '评分必须在 1-5 之间' },
        { status: 400 }
      );
    }

    // 使用事务创建评价并更新跑手平均评分
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建评价
      const review = await tx.review.create({
        data: {
          orderId: params.id,
          userId: payload.userId,
          runnerId: order.runnerId,
          rating: parseInt(rating),
          comment: comment || null,
        },
      });

      // 2. 计算并更新跑手平均评分
      const reviews = await tx.review.findMany({
        where: { runnerId: order.runnerId },
        select: { rating: true },
      });

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await tx.runnerProfile.update({
        where: { id: order.runnerId },
        data: {
          rating: Math.round(avgRating * 10) / 10, // 保留一位小数
        },
      });

      return review;
    });

    return NextResponse.json({
      success: true,
      message: '评价成功',
      review: result,
    });
  } catch (error) {
    console.error('评价失败:', error);
    return NextResponse.json(
      { error: '评价失败，请稍后重试' },
      { status: 500 }
    );
  }
}
