import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, role = 'RUNNER', nickname, avatar, contactPhone, platform, bio, pricePer10M } = body;

    // 校验必填字段
    if (!phone || !password) {
      return NextResponse.json(
        { error: '手机号和密码不能为空' },
        { status: 400 }
      );
    }

    // 跑手需要额外字段
    if (role === 'RUNNER') {
      if (!nickname || !contactPhone || !platform || !pricePer10M) {
        return NextResponse.json(
          { error: '缺少必填字段：昵称、联系手机号、平台、价格' },
          { status: 400 }
        );
      }
    }

    // 检查手机号是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该手机号已被注册' },
        { status: 409 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（事务）
    const user = await prisma.$transaction(async (tx) => {
      // 1. 创建用户
      const newUser = await tx.user.create({
        data: {
          phone,
          password: hashedPassword,
          role: role === 'BOSS' ? 'BOSS' : 'RUNNER',
        },
      });

      // 2. 如果是跑手，创建跑手资料
      if (role === 'RUNNER') {
        await tx.runnerProfile.create({
          data: {
            userId: newUser.id,
            nickname,
            avatar: avatar || null,
            phone: contactPhone,
            platform,
            bio: bio || null,
            pricePer10M: parseInt(pricePer10M),
            status: 'ONLINE',
            rating: 5.0,
            ordersCount: 0,
          },
        });
      }

      return newUser;
    });

    // 生成 JWT
    const token = signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
