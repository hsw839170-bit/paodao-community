import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ACCEPTED_TIMEOUT_HOURS = 24

/**
 * 检查并处理超时订单
 * 
 * 运行频率: 每 5 分钟（由 Vercel Cron 触发）
 * 
 * 检查逻辑:
 * 1. ACCEPTED 状态超过 24 小时的订单 → 自动标记为 COMPLETED
 */
async function checkExpiredOrders() {
  const now = new Date()
  const acceptedTimeout = new Date(now.getTime() - ACCEPTED_TIMEOUT_HOURS * 60 * 60 * 1000)

  console.log(`[${now.toISOString()}] 开始检查超时订单...`)

  // 1. 查找已接单超时的订单（ACCEPTED 超过 24 小时）
  const expiredAcceptedOrders = await prisma.order.findMany({
    where: {
      status: 'ACCEPTED',
      updatedAt: {
        lt: acceptedTimeout
      }
    },
    select: {
      id: true,
      updatedAt: true,
      runner: {
        select: {
          id: true,
          nickname: true
        }
      },
      user: {
        select: {
          id: true,
          phone: true
        }
      }
    }
  })

  console.log(`找到 ${expiredAcceptedOrders.length} 个已接单超时的订单`)

  // 2. 批量更新为 COMPLETED
  if (expiredAcceptedOrders.length > 0) {
    const orderIds = expiredAcceptedOrders.map(o => o.id)
    
    const result = await prisma.order.updateMany({
      where: {
        id: {
          in: orderIds
        }
      },
      data: {
        status: 'COMPLETED',
        updatedAt: now
      }
    })

    console.log(`✓ 已自动完成 ${result.count} 个订单`)

    // 3. 更新跑手的订单完成数和状态
    for (const order of expiredAcceptedOrders) {
      if (!order.runner) continue // 跳过无跑手的订单
      
      await prisma.runnerProfile.update({
        where: { id: order.runner.id },
        data: {
          ordersCount: {
            increment: 1
          },
          status: 'ONLINE' // 从 BUSY 改回 ONLINE
        }
      })
      console.log(`  - 订单 ${order.id.substring(0, 8)}... | 跑手: ${order.runner.nickname} | 超时自动完成`)
    }
  }

  console.log(`[${new Date().toISOString()}] 超时检查完成`)
  
  return {
    success: true,
    checkedAt: now,
    autoCompletedCount: expiredAcceptedOrders.length,
    orders: expiredAcceptedOrders.map(o => ({
      id: o.id,
      runner: o.runner?.nickname || '未知跑手',
      user: o.user.phone,
      updatedAt: o.updatedAt
    }))
  }
}

/**
 * POST /api/cron/check-expired-orders
 * 
 * 检查并处理超时订单
 * 可由 Vercel Cron 或外部定时服务调用
 * 
 * 安全：建议设置 CRON_SECRET 环境变量进行验证
 */
export async function POST(request: NextRequest) {
  try {
    // 验证调用者身份（防止被恶意调用）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 执行超时检查
    const result = await checkExpiredOrders()

    return NextResponse.json({
      message: `已处理 ${result.autoCompletedCount} 个超时订单`,
      ...result
    })

  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/check-expired-orders
 * 
 * 仅用于测试，查看将要处理的订单（不会实际修改）
 */
export async function GET(request: NextRequest) {
  try {
    // 仅开发环境允许 GET 测试
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Use POST in production' },
        { status: 405 }
      )
    }

    const now = new Date()
    const acceptedTimeout = new Date(now.getTime() - ACCEPTED_TIMEOUT_HOURS * 60 * 60 * 1000)

    // 预览将要处理的订单
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'ACCEPTED',
        updatedAt: {
          lt: acceptedTimeout
        }
      },
      select: {
        id: true,
        updatedAt: true,
        status: true,
        runner: {
          select: {
            nickname: true
          }
        },
        user: {
          select: {
            phone: true
          }
        }
      }
    })

    return NextResponse.json({
      preview: true,
      currentTime: now,
      timeoutThreshold: acceptedTimeout,
      wouldProcess: expiredOrders.length,
      orders: expiredOrders
    })

  } catch (error) {
    console.error('Preview failed:', error)
    return NextResponse.json(
      { error: 'Failed to preview' },
      { status: 500 }
    )
  }
}
