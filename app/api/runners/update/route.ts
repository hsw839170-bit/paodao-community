import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    // 从请求头获取 token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 验证 token
    const payload = verifyToken(token);

    // 获取更新数据
    const body = await request.json();
    const { nickname, avatar, phone, platform, bio, pricePer10M, status } = body;

    // 验证头像 URL 格式（如果提供）
    if (avatar) {
      try {
        new URL(avatar);
      } catch {
        return NextResponse.json(
          { error: '头像 URL 格式不正确' },
          { status: 400 }
        );
      }
    }

    // 验证价格范围（如果提供）
    if (pricePer10M) {
      const price = parseInt(pricePer10M);
      if (isNaN(price) || price < 1 || price > 10000) {
        return NextResponse.json(
          { error: '价格必须在 1-10000 元之间' },
          { status: 400 }
        );
      }
    }

    // 验证手机号格式（如果提供）
    if (phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: '请输入正确的手机号格式' },
          { status: 400 }
        );
      }
    }

    // 更新跑手资料
    const updatedProfile = await prisma.runnerProfile.update({
      where: { userId: payload.userId },
      data: {
        ...(nickname && { nickname }),
        ...(avatar !== undefined && { avatar }),
        ...(phone && { phone }),
        ...(platform && { platform }),
        ...(bio !== undefined && { bio }),
        ...(pricePer10M && { pricePer10M: parseInt(pricePer10M) }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      success: true,
      message: '资料更新成功',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('更新资料失败:', error);
    return NextResponse.json(
      { error: '更新资料失败，请稍后重试' },
      { status: 500 }
    );
  }
}
