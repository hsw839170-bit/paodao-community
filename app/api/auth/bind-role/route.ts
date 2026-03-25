import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

/**
 * POST /api/auth/bind-role
 * 
 * 为已登录用户绑定新角色（跑手或老板）
 * 用于身份体系临时补丁：允许一个账号同时拥有跑手和老板身份
 */

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    // 获取请求数据
    const body = await request.json();
    const { role, nickname, avatar, contactPhone, platform, bio, pricePer10M } = body;

    if (!role || !['RUNNER', 'BOSS'].includes(role)) {
      return NextResponse.json(
        { error: '无效的角色类型' },
        { status: 400 }
      );
    }

    // 获取当前用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    // 检查是否已有该角色
    if (role === 'RUNNER' && user.runnerProfile) {
      return NextResponse.json(
        { error: '您已经是跑手，无需重复绑定' },
        { status: 400 }
      );
    }

    // 绑定跑手角色
    if (role === 'RUNNER') {
      // 校验必填字段
      if (!nickname || !contactPhone || !platform || !pricePer10M) {
        return NextResponse.json(
          { error: '缺少必填字段：昵称、联系手机号、平台、价格' },
          { status: 400 }
        );
      }

      const runnerProfile = await prisma.runnerProfile.create({
        data: {
          userId: user.id,
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

      return NextResponse.json({
        success: true,
        message: '跑手身份绑定成功',
        runnerProfile,
      });
    }

    // 绑定老板角色（目前只需更新 user.role）
    if (role === 'BOSS') {
      // 如果当前不是老板，更新角色为 BOSS
      // 注意：这里假设 RUNNER 也可以有 BOSS 权限
      if (user.role !== 'BOSS') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'BOSS' },
        });
      }

      return NextResponse.json({
        success: true,
        message: '老板身份绑定成功',
      });
    }

    return NextResponse.json(
      { error: '无效的角色类型' },
      { status: 400 }
    );
  } catch (error) {
    console.error('绑定角色失败:', error);
    return NextResponse.json(
      { error: '绑定角色失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/roles
 * 
 * 获取当前用户的所有角色信息
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    return NextResponse.json({
      success: true,
      roles: {
        isBoss: user.role === 'BOSS',
        isRunner: !!user.runnerProfile,
      },
      runnerProfile: user.runnerProfile,
    });
  } catch (error) {
    console.error('获取角色信息失败:', error);
    return NextResponse.json(
      { error: '获取角色信息失败' },
      { status: 500 }
    );
  }
}
