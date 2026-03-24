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
