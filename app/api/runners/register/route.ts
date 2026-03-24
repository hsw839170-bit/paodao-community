import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // 验证必填字段
    if (!data.name || !data.contact || !data.platform) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 创建跑手
    const runner = await prisma.runner.create({
      data: {
        name: data.name,
        contact: data.contact,
        platform: data.platform,
        bio: data.bio || '',
        verified: false,
        status: 'active'
      }
    })

    return NextResponse.json({ success: true, runner })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
