import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
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
