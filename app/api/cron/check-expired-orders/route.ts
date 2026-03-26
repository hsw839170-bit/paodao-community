import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

const ACCEPTED_TIMEOUT_HOURS = 24
const BATCH_SIZE = 50 // 分页批次大小

/**
 * 检查并处理超时的 PUBLIC PENDING 订单
 * 
 * 逻辑：
 * - 查询 mode='PUBLIC' AND status='PENDING' AND claimDeadline < now 的订单
 * - 分批处理，每批 BATCH_SIZE 条
 * - 每笔订单在事务中更新为 CANCELED + 创建 OrderLog
 * - 通知下单老板（失败不回滚）
 */
async function expirePublicPendingOrders() {
  const now = new Date()
  console.log(`[${now.toISOString()}] 开始检查过期的 PUBLIC PENDING 订单...`)

  let processedCount = 0
  let cursor: string | undefined

  while (true) {
    // 1. 查询一批过期的 PUBLIC PENDING 订单
    const expiredOrders = await prisma.order.findMany({
      where: {
        mode: 'PUBLIC',
        status: 'PENDING',
        claimDeadline: { lt: now }
      },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
      include: {
        user: { select: { id: true, phone: true } }
      }
    })

    if (expiredOrders.length === 0) break

    // 2. 逐笔处理（每笔独立事务）
    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // 双重检查：确保订单仍是 PENDING 状态
          const currentOrder = await tx.order.findUnique({
            where: { id: order.id },
            select: { status: true }
          })

          if (currentOrder?.status !== 'PENDING') {
            console.log(`  - 订单 ${order.id.substring(0, 8)}... 状态已变更，跳过`)
            return
          }

          // 更新订单为 CANCELED
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELED',
              updatedAt: now
            }
          })

          // 创建 OrderLog
          await tx.orderLog.create({
            data: {
              orderId: order.id,
              actorType: 'SYSTEM',
              actorId: 'system',
              action: 'CANCEL',
              message: '订单过期未接单，系统自动取消'
            }
          })
        })

        processedCount++
        console.log(`  ✓ 订单 ${order.id.substring(0, 8)}... 已自动取消 | 老板: ${order.user.phone}`)

        // 3. 通知老板（fire-and-forget，失败不回滚）
        createNotification({
          type: 'ORDER_CANCELLED',
          userId: order.userId,
          title: '订单已过期取消',
          message: '您的公开发布订单因过期未被接单，已自动取消。您可重新发布或指定跑手下单。',
          orderId: order.id
        }).catch((err) => {
          console.error(`  ! 通知老板失败 (订单 ${order.id.substring(0, 8)}...):`, err)
        })

      } catch (error) {
        console.error(`  ✗ 处理订单 ${order.id.substring(0, 8)}... 失败:`, error)
        // 继续处理下一笔
      }
    }

    // 更新游标
    cursor = expiredOrders[expiredOrders.length - 1].id

    // 如果本批不足 BATCH_SIZE，说明已处理完
    if (expiredOrders.length < BATCH_SIZE) break
  }

  console.log(`[${new Date().toISOString()}] PUBLIC PENDING 过期检查完成，共处理 ${processedCount} 个订单`)
  return { processedCount }
}

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

    // 1. 处理 ACCEPTED 超时订单
    const acceptedResult = await checkExpiredOrders()

    // 2. 处理 PUBLIC PENDING 过期订单
    const publicPendingResult = await expirePublicPendingOrders()

    return NextResponse.json({
      message: `处理完成：${acceptedResult.autoCompletedCount} 个 ACCEPTED 订单自动完成，${publicPendingResult.processedCount} 个 PUBLIC PENDING 订单过期取消`,
      accepted: acceptedResult,
      publicPending: publicPendingResult
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
