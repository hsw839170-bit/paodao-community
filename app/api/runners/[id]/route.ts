import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const runner = await prisma.runnerProfile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
          }
        },
        // 获取平均评分
        reviews: {
          select: {
            rating: true,
          }
        }
      }
    })

    if (!runner) {
      return NextResponse.json({ error: '跑手不存在' }, { status: 404 })
    }

    // 计算实际评分
    const avgRating = runner.reviews.length > 0
      ? runner.reviews.reduce((sum, r) => sum + r.rating, 0) / runner.reviews.length
      : runner.rating

    // 返回前端需要的格式
    const formattedRunner = {
      id: runner.id,
      name: runner.nickname,
      contact: runner.phone,
      platform: runner.platform === 'PC' ? '端游' : runner.platform === 'MOBILE' ? '手游' : '端游/手游',
      rating: avgRating.toFixed(1) + '分',
      orders: runner.ordersCount,
      status: runner.status === 'ONLINE' ? 'online' : 'offline',
      pricePer10M: runner.pricePer10M,
      verified: runner.ordersCount >= 10, // 10单以上视为已认证
      avatar: runner.avatar,
      bio: runner.bio,
    }

    return NextResponse.json(formattedRunner)
  } catch (error) {
    console.error('Failed to fetch runner:', error)
    return NextResponse.json({ error: '获取跑手信息失败' }, { status: 500 })
  }
}
