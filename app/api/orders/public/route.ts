import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/orders/public
 * 获取公开抢单模式的订单列表（分页）
 * 
 * TODO: 生产环境需要添加 Redis 缓存
 * TODO: 需要并发控制（分布式锁）在抢单时防止重复接单
 * 
 * Query Params:
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 20，最大 100）
 * - platform: 筛选平台（PC | MOBILE | BOTH）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const platform = searchParams.get('platform');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      mode: 'PUBLIC',
      status: 'PENDING',
      // 只返回未过期的订单
      claimDeadline: {
        gt: new Date()
      }
    };

    // 平台筛选（需要关联跑手资料，PUBLIC 订单暂时跳过此筛选）
    // TODO: 根据订单中的 platform 字段筛选（需要在 Order 模型添加 platform 字段）

    // 查询公开订单
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    // 格式化返回数据（隐藏用户手机号）
    const formattedOrders = orders.map(order => ({
      id: order.id,
      amount: order.amount,
      gameAmount: order.gameAmount,
      note: order.note,
      claimDeadline: order.claimDeadline,
      createdAt: order.createdAt,
      // 只显示部分手机号
      bossPhone: order.user.phone.slice(0, 3) + '****' + order.user.phone.slice(-4)
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取公开订单列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取订单列表失败' },
      { status: 500 }
    );
  }
}
