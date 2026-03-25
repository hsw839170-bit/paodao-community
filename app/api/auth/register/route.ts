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

    // 校验手机号格式（中国大陆）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: '请输入正确的手机号格式' },
        { status: 400 }
      );
    }

    // 校验密码长度
    if (password.length < 6 || password.length > 32) {
      return NextResponse.json(
        { error: '密码长度必须在 6-32 位之间' },
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
      include: {
        runnerProfile: true,
      },
    });

    // 如果用户已存在，返回特殊响应，前端引导绑定角色
    if (existingUser) {
      const hasRunnerProfile = !!existingUser.runnerProfile;
      const isBoss = existingUser.role === 'BOSS';
      
      // 检查密码是否正确
      const isValidPassword = await bcrypt.compare(password, existingUser.password);
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: '该手机号已注册，密码错误' },
          { status: 409 }
        );
      }

      // 根据请求的角色和现有角色判断
      if (role === 'RUNNER' && hasRunnerProfile) {
        return NextResponse.json(
          { error: '该账号已经是跑手，请直接登录' },
          { status: 409 }
        );
      }

      if (role === 'BOSS' && isBoss) {
        return NextResponse.json(
          { error: '该账号已经是老板，请直接登录' },
          { status: 409 }
        );
      }

      // 可以绑定新角色
      return NextResponse.json({
        success: false,
        code: 'ROLE_BIND_REQUIRED',
        message: '该手机号已注册，是否绑定新角色？',
        existingRoles: {
          isBoss,
          isRunner: hasRunnerProfile,
        },
        requestedRole: role,
        user: {
          id: existingUser.id,
          phone: existingUser.phone,
          role: existingUser.role,
        },
      }, { status: 200 });
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
