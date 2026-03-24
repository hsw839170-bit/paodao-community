import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const runner = await prisma.runnerProfile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!runner) {
      return NextResponse.json(
        { error: '跑手不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(runner);
  } catch (error) {
    console.error('获取跑手详情失败:', error);
    return NextResponse.json(
      { error: '获取跑手详情失败' },
      { status: 500 }
    );
  }
}
