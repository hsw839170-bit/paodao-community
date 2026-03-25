import { NextRequest, NextResponse } from 'next/server'
import { isSmsVerifyEnabled, verifyCode, deleteCode } from '@/lib/verification-codes'
import { signToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/verify-code
 * 
 * 验证短信验证码
 * - 检查 FEATURE_SMS_VERIFY 开关
 * - 验证验证码是否正确
 * - 验证成功后：
 *   - 如果用户存在：返回登录 token
 *   - 如果用户不存在：返回预注册 token（用于继续注册流程）
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
    const { phone, code } = body

    // 验证参数
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '请输入正确的手机号格式' },
        { status: 400 }
      )
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: '请输入 6 位数字验证码' },
        { status: 400 }
      )
    }

    // 验证验证码
    const isValid = verifyCode(phone, code)
    if (!isValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期', code: 'INVALID_CODE' },
        { status: 400 }
      )
    }

    // 验证成功，删除验证码
    deleteCode(phone)

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { phone },
      include: { runnerProfile: true }
    })

    if (existingUser) {
      // 用户存在：生成登录 token
      const token = signToken({
        userId: existingUser.id,
        phone: existingUser.phone,
        role: existingUser.role,
      })

      return NextResponse.json({
        success: true,
        message: '验证成功',
        action: 'LOGIN',
        token,
        user: {
          id: existingUser.id,
          phone: existingUser.phone,
          role: existingUser.role,
          hasRunnerProfile: !!existingUser.runnerProfile,
        }
      })
    } else {
      // 用户不存在：生成预注册 token（短期有效）
      const preRegisterToken = signToken({
        userId: `temp_${Date.now()}`,
        phone,
        role: 'PENDING_REGISTRATION',
      }, '15m') // 15 分钟有效

      return NextResponse.json({
        success: true,
        message: '验证成功',
        action: 'REGISTER',
        preRegisterToken,
        phone
      })
    }

  } catch (error) {
    console.error('验证验证码失败:', error)
    return NextResponse.json(
      { error: '验证失败，请稍后重试' },
      { status: 500 }
    )
  }
}
