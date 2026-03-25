import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { storeCode } from '@/lib/verification-codes'

/**
 * POST /api/auth/forgot-password
 * 
 * 发送短信验证码
 * 流程：
 * 1. 验证手机号是否存在
 * 2. 生成 6 位验证码
 * 3. 存储到内存（5分钟有效，生产环境应使用 Redis）
 * 4. 调用短信服务发送
 * 
 * TODO: 需要配置短信服务（阿里云/腾讯云/Twilio）
 */

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { phone }
    })

    if (!user) {
      // 为了安全，不暴露手机号是否注册
      // 但实际业务中可能需要提示"手机号未注册"
      return NextResponse.json(
        { error: '该手机号未注册' },
        { status: 404 }
      )
    }

    // 生成 6 位验证码
    const code = Math.random().toString().slice(2, 8)
    
    // 存储验证码
    storeCode(phone, code)

    // TODO: 调用短信服务发送验证码
    // 当前仅打印到控制台（开发模式）
    console.log(`[验证码] ${phone}: ${code}`)
    
    // 示例：阿里云短信
    // await sendSms(phone, code)

    // 开发环境返回验证码（方便测试）
    const isDev = process.env.NODE_ENV === 'development'
    
    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      ...(isDev && { code }) // 开发环境返回验证码
    })

  } catch (error) {
    console.error('发送验证码失败:', error)
    return NextResponse.json(
      { error: '发送失败，请稍后重试' },
      { status: 500 }
    )
  }
}
