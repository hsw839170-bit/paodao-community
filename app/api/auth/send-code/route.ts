import { NextRequest, NextResponse } from 'next/server'
import { isSmsVerifyEnabled, checkRateLimit, storeCode, getCodeForDev } from '@/lib/verification-codes'

/**
 * POST /api/auth/send-code
 * 
 * 发送短信验证码
 * - 检查 FEATURE_SMS_VERIFY 开关
 * - 检查频率限制（每手机号每分钟 N 次）
 * - 生成 6 位验证码并存储
 * - 开发环境返回验证码（仅用于测试）
 * 
 * 生产环境需要配置短信服务商（阿里云/腾讯云等）
 */

export async function POST(request: NextRequest) {
  try {
    // 检查功能开关
    if (!isSmsVerifyEnabled()) {
      return NextResponse.json(
        { error: '短信验证功能未启用', code: 'SMS_NOT_ENABLED' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { phone } = body

    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '请输入正确的手机号格式' },
        { status: 400 }
      )
    }

    // 检查频率限制
    const rateCheck = checkRateLimit(phone)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: rateCheck.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60
        },
        { status: 429 }
      )
    }

    // 生成 6 位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 存储验证码
    storeCode(phone, code)

    // TODO: 生产环境接入短信服务商
    // 阿里云短信示例：
    // await sendAliyunSms(phone, code)
    // 
    // 腾讯云短信示例：
    // await sendTencentSms(phone, code)
    
    // 开发环境：打印到控制台并返回验证码
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      console.log(`[DEV] 验证码发送成功: ${phone} -> ${code}`)
    } else {
      console.log(`[PROD] 验证码发送成功: ${phone} -> **** (隐藏)`)
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      // 开发环境返回验证码（仅用于测试）
      ...(isDev && { code, remainingAttempts: rateCheck.remaining }),
      // 生产环境只返回剩余次数
      ...(!isDev && { remainingAttempts: rateCheck.remaining })
    })

  } catch (error) {
    console.error('发送验证码失败:', error)
    return NextResponse.json(
      { error: '发送失败，请稍后重试' },
      { status: 500 }
    )
  }
}
