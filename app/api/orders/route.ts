import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

// 老板创建订单
export async function POST(request: NextRequest) {
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

    // 获取请求数据
    const body = await request.json();
    const { runnerId, amount, gameAmount, note, platform } = body;

    // 验证必填字段
    if (!runnerId || !amount) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证跑手存在且在线
    const runner = await prisma.runnerProfile.findUnique({
      where: { id: runnerId },
    });

    if (!runner) {
      return NextResponse.json(
        { error: '跑手不存在' },
        { status: 404 }
      );
    }

    // 检查跑手是否已有进行中的订单（避免重复下单给忙碌跑手）
    const activeOrder = await prisma.order.findFirst({
      where: {
        runnerId: runnerId,
        status: 'ACCEPTED',
      },
    });

    // 创建订单
    const order = await prisma.order.create({
      data: {
        userId: payload.userId,      // 下单用户ID
        runnerId: runnerId,          // 跑手ID
        amount: amount,              // 金额
        gameAmount: gameAmount || null,  // 游戏币数量
        note: note || null,          // 备注
        status: 'PENDING',           // 初始状态：待接单
      },
      include: {
        runner: {
          select: {
            id: true,
            nickname: true,
            phone: true,
            avatar: true,
          },
        },
        user: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: '订单创建成功',
      order,
      warning: activeOrder ? '该跑手当前有进行中的订单，可能需要等待' : null,
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json(
      { error: '创建订单失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取订单列表（老板视角 - 我下的单）
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
      userId: payload.userId,  // 查询我下的单
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
