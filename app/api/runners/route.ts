import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/runners
 * 获取在线跑手列表（简化版，供内部使用）
 * 
 * 注意：不返回敏感信息（如手机号）
 */
export async function GET() {
  try {
    const runners = await prisma.runnerProfile.findMany({
      where: { status: { in: ['ONLINE', 'BUSY'] } },
      orderBy: { rating: 'desc' },
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
        // 不返回 user 关联信息，避免泄露敏感数据
      }
    })
    
    return NextResponse.json(runners)
  } catch (error) {
    console.error('Failed to fetch runners:', error)
    return NextResponse.json({ error: 'Failed to fetch runners' }, { status: 500 })
  }
}
