import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    // 检查是否为管理员（目前仅检查是否为 BOSS 角色，未来可扩展为 ADMIN 角色）
    if (payload.role !== 'BOSS' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权访问此接口' },
        { status: 403 }
      );
    }

    // 获取所有跑手资料（包含用户信息）
    const runners = await prisma.runnerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      count: runners.length,
      runners,
    });
  } catch (error) {
    console.error('获取跑手列表失败:', error);
    return NextResponse.json(
      { error: '获取跑手列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}
