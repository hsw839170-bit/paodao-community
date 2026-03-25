import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { computeRunnerStatus } from '@/lib/runner-status';

export async function GET(request: NextRequest) {
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

    // 查询跑手资料
    const profile = await prisma.runnerProfile.findUnique({
      where: { userId: payload.userId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: '跑手资料不存在' },
        { status: 404 }
      );
    }

    // 计算 computedStatus
    const computedStatus = await computeRunnerStatus(profile.id);

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        manualStatus: profile.status, // 手动设置的状态（ONLINE/OFFLINE）
        computedStatus, // 计算后的状态（ONLINE/OFFLINE/BUSY）
      },
    });
  } catch (error) {
    console.error('获取资料失败:', error);
    return NextResponse.json(
      { error: '获取资料失败，请重新登录' },
      { status: 401 }
    );
  }
}
