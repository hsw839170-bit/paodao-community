import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeRunnersStatus } from '@/lib/runner-status'

// 公开接口：获取在线跑手列表（首页展示）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') // 可选筛选：PC | MOBILE | BOTH
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    // 构建查询条件
    // 修改：只查询手动设置为 ONLINE 的跑手（BUSY 也算作可展示）
    const where: any = {
      status: 'ONLINE' // 只显示手动标记为在线的
    }

    // 平台筛选
    if (platform && platform !== 'ALL') {
      where.platform = {
        in: platform === 'BOTH' ? ['PC', 'MOBILE', 'BOTH'] : [platform, 'BOTH']
      }
    }

    // 价格筛选
    if (minPrice || maxPrice) {
      where.pricePer10M = {}
      if (minPrice) {
        where.pricePer10M.gte = parseInt(minPrice)
      }
      if (maxPrice) {
        where.pricePer10M.lte = parseInt(maxPrice)
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
        status: true, // 这是手动设置的状态
        rating: true,
        ordersCount: true,
      },
      orderBy: {
        ordersCount: 'desc' // 按订单数排序
      }
    })

    // 计算每个跑手的 computedStatus
    const runnerIds = runners.map(r => r.id)
    const statusMap = await computeRunnersStatus(runnerIds)

    // 合并 computedStatus 到返回数据
    const runnersWithComputedStatus = runners.map(runner => ({
      ...runner,
      manualStatus: runner.status, // 手动设置的状态
      computedStatus: statusMap.get(runner.id) || runner.status // 计算后的状态（包含 BUSY）
    }))

    return NextResponse.json({
      success: true,
      count: runners.length,
      runners: runnersWithComputedStatus
    })

  } catch (error) {
    console.error('获取跑手列表错误:', error)
    return NextResponse.json(
      { error: '获取列表失败' },
      { status: 500 }
    )
  }
}
