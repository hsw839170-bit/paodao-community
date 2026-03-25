import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verifyCode, deleteCode } from '@/lib/verification-codes'

/**
 * POST /api/auth/reset-password
 * 
 * 重置密码
 * 流程：
 * 1. 验证手机号、验证码、新密码
 * 2. 验证验证码是否正确
 * 3. 更新密码
 * 4. 删除已使用的验证码
 */

export async function POST(request: NextRequest) {
  try {
    const { phone, code, password } = await request.json()

    // 验证必填字段
    if (!phone || !code || !password) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      )
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度不能少于6位' },
        { status: 400 }
      )
    }

    // 验证验证码
    if (!verifyCode(phone, code)) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { phone }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 更新密码
    await prisma.user.update({
      where: { phone },
      data: { password: hashedPassword }
    })

    // 删除已使用的验证码
    deleteCode(phone)

    return NextResponse.json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    })

  } catch (error) {
    console.error('重置密码失败:', error)
    return NextResponse.json(
      { error: '重置失败，请稍后重试' },
      { status: 500 }
    )
  }
}
