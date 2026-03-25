import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

/**
 * GET /api/orders/public
 * 获取公开发布的订单列表（抢单大厅）
 * 
 * 查询条件:
 * - mode = 'PUBLIC'
 * - status = 'PENDING'
 * - 未过期（claimDeadline > now 或 claimDeadline is null）
 * 
 * 支持筛选参数:
 * - platform: PC | MOBILE | BOTH（⚠️ 当前未启用，见下方说明）
 * - minPrice: 最低价格
 * - maxPrice: 最高价格
 * - sort: createdAt | amount（排序字段）
 * - order: asc | desc（排序方向）
 * 
 * 关于平台筛选的说明:
 * ------------------
 * PUBLIC 订单在创建时尚未关联跑手，因此无法按平台筛选。
 * 如需支持平台筛选，需在下单时新增 platform 字段（方案 A）。
 * 当前实现：暂不支持按平台筛选 PUBLIC 订单（方案 B）。
 */
export async function GET(request: NextRequest) {
  try {
    // 可选：验证登录（未登录也可查看，但登录后才能抢单）
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? extractTokenFromHeader(authHeader) : null;
    let userId = null;
    
    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
      } catch {
        // Token 无效，继续作为未登录用户
      }
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // 构建 where 条件
    const where: any = {
      mode: 'PUBLIC',
      status: 'PENDING',
      OR: [
        { claimDeadline: { gt: new Date() } },
        { claimDeadline: null },
      ],
    };

    // 平台筛选（通过 runner 关联，但 PUBLIC 订单暂时无 runner，此筛选可能需要调整）
    // 实际上 PUBLIC 订单创建时还不知道哪个平台跑手会接单
    // 可能需要从订单 note 或其他字段推断，或暂时不支持

    // 价格筛选
    if (minPrice) {
      where.amount = { ...(where.amount || {}), gte: parseInt(minPrice) };
    }
    if (maxPrice) {
      where.amount = { ...(where.amount || {}), lte: parseInt(maxPrice) };
    }

    // 构建 orderBy
    const orderBy: any = {};
    if (sort === 'amount') {
      orderBy.amount = order;
    } else {
      orderBy.createdAt = order;
    }

    // 查询订单
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        amount: true,
        gameAmount: true,
        note: true,
        claimDeadline: true,
        createdAt: true,
        user: {
          select: {
            id: true,
          },
        },
      },
      orderBy,
      take: limit + 1, // 多取一条用于判断是否有下一页
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    // 判断是否还有下一页
    const hasMore = orders.length > limit;
    const results = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    return NextResponse.json({
      success: true,
      count: results.length,
      orders: results,
      hasMore,
      nextCursor,
    });

  } catch (error) {
    console.error('获取公开订单失败:', error);
    return NextResponse.json(
      { error: '获取公开订单失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/public
 * 创建公开发布的订单（抢单大厅）
 * 
 * 权限：仅限 BOSS 身份
 * 特点：不指定跑手，由跑手主动抢单
 */
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

    // 验证必须是 BOSS 身份
    if (payload.role !== 'BOSS') {
      return NextResponse.json(
        { error: '只有老板可以发布公开订单' },
        { status: 403 }
      );
    }

    // 获取请求数据
    const body = await request.json();
    const { 
      title, 
      description, 
      amount, 
      gameAmount, 
      claimDeadline,
      platform 
    } = body;

    // 验证必填字段
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: '订单标题不能为空' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: '订单标题不能超过 100 字符' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: '订单金额不能为空' },
        { status: 400 }
      );
    }

    // 验证金额范围
    const orderAmount = parseInt(amount);
    if (isNaN(orderAmount) || orderAmount < 1 || orderAmount > 100000) {
      return NextResponse.json(
        { error: '订单金额必须在 1-100000 元之间' },
        { status: 400 }
      );
    }

    // 验证游戏币数量（可选）
    let parsedGameAmount = null;
    if (gameAmount) {
      parsedGameAmount = parseInt(gameAmount);
      if (isNaN(parsedGameAmount) || parsedGameAmount < 1 || parsedGameAmount > 1000000) {
        return NextResponse.json(
          { error: '游戏币数量无效' },
          { status: 400 }
        );
      }
    }

    // 验证描述长度（可选）
    if (description && description.length > 500) {
      return NextResponse.json(
        { error: '描述长度不能超过 500 字符' },
        { status: 400 }
      );
    }

    // 验证抢单截止时间（可选，默认 24 小时）
    let parsedDeadline = null;
    if (claimDeadline) {
      parsedDeadline = new Date(claimDeadline);
      const now = new Date();
      const maxDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 最多 7 天
      
      if (isNaN(parsedDeadline.getTime()) || parsedDeadline <= now || parsedDeadline > maxDeadline) {
        return NextResponse.json(
          { error: '抢单截止时间无效（必须在 1 小时到 7 天之间）' },
          { status: 400 }
        );
      }
    } else {
      // 默认 24 小时
      parsedDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // 验证平台筛选（可选）
    const validPlatforms = ['PC', 'MOBILE', 'BOTH'];
    const orderPlatform = platform && validPlatforms.includes(platform) ? platform : null;

    // 创建 PUBLIC 订单
    const order = await prisma.order.create({
      data: {
        userId: payload.userId,
        runnerId: null, // PUBLIC 订单不指定跑手
        mode: 'PUBLIC',
        status: 'PENDING',
        amount: orderAmount,
        gameAmount: parsedGameAmount,
        note: description || null, // 使用 description 作为 note
        claimDeadline: parsedDeadline,
        // platform 字段需要添加到 Prisma schema，暂时存储在 note 中或后续扩展
        progress: 0,
        progressNote: orderPlatform ? `平台要求: ${orderPlatform}` : null,
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

    return NextResponse.json({
      success: true,
      message: '订单已发布到抢单大厅',
      order: {
        ...order,
        platform: orderPlatform, // 返回平台要求（从 note 解析）
      },
    });

  } catch (error) {
    console.error('创建公开订单失败:', error);
    return NextResponse.json(
      { error: '创建订单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
