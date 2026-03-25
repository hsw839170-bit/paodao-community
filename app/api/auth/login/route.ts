import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, rememberMe } = body;

    // 校验必填字段
    if (!phone || !password) {
      return NextResponse.json(
        { error: '手机号和密码不能为空' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        runnerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 根据 rememberMe 设置 token 过期时间
    // 记住我: 30天, 不记住: 1天
    const tokenExpiresIn = rememberMe ? '30d' : '1d';
    
    // 生成 JWT
    const token = signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    }, tokenExpiresIn);

    return NextResponse.json({
      success: true,
      message: '登录成功',
      token,
      expiresIn: tokenExpiresIn,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        profile: user.runnerProfile,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
