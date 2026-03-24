import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 公开接口：获取在线跑手列表（首页展示）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') // 可选筛选：PC | MOBILE | BOTH

    // 构建查询条件
    const where: any = {
      status: 'ONLINE' // 只显示在线的
    }

    if (platform && platform !== 'ALL') {
      where.platform = {
        in: platform === 'BOTH' ? ['PC', 'MOBILE', 'BOTH'] : [platform, 'BOTH']
      }
    }

    // 查询在线跑手
    const runners = await prisma.runnerProfile.findMany({
      where,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        platform: true,
        bio: true,
        pricePer10M: true,
        status: true,
        rating: true,
        ordersCount: true,
      },
      orderBy: {
        ordersCount: 'desc' // 按订单数排序
      }
    })

    return NextResponse.json({
      success: true,
      count: runners.length,
      runners
    })

  } catch (error) {
    console.error('获取跑手列表错误:', error)
    return NextResponse.json(
      { error: '获取列表失败' },
      { status: 500 }
    )
  }
}
