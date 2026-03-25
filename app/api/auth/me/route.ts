import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken, signToken } from '@/lib/auth';

/**
 * POST /api/auth/switch-role
 * 切换当前激活的身份（BOSS / RUNNER）
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const { targetRole } = await request.json();

    // 验证目标角色
    if (targetRole !== 'BOSS' && targetRole !== 'RUNNER') {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      );
    }

    // 获取用户完整信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { runnerProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查用户是否有目标角色的权限
    const hasRunnerProfile = !!user.runnerProfile;
    const isBoss = user.role === 'BOSS';

    // 如果要切换到 RUNNER，必须有跑手资料
    if (targetRole === 'RUNNER' && !hasRunnerProfile) {
      return NextResponse.json(
        { 
          error: '您还没有跑手资料，请先入驻',
          code: 'NO_RUNNER_PROFILE',
          canCreate: true
        },
        { status: 403 }
      );
    }

    // 如果要切换到 BOSS，用户 role 必须是 BOSS
    if (targetRole === 'BOSS' && !isBoss) {
      // 可以自动升级为 BOSS 角色
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'BOSS' },
      });
    }

    // 生成新 token，包含 activeRole
    const newToken = signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role === 'BOSS' || targetRole === 'BOSS' ? 'BOSS' : 'RUNNER',
      activeRole: targetRole,
    });

    // 返回用户信息和激活的角色
    return NextResponse.json({
      success: true,
      message: `已切换到${targetRole === 'BOSS' ? '老板' : '跑手'}身份`,
      token: newToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        activeRole: targetRole,
        hasRunnerProfile,
        isBoss: user.role === 'BOSS' || targetRole === 'BOSS',
      },
    });

  } catch (error) {
    console.error('切换身份失败:', error);
    return NextResponse.json(
      { error: '切换身份失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/me
 * 获取当前用户信息，包括激活的角色
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    // 获取用户完整信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { runnerProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const hasRunnerProfile = !!user.runnerProfile;
    const isBoss = user.role === 'BOSS';

    // 确定当前激活的角色
    let activeRole = 'RUNNER';
    if (payload.activeRole) {
      activeRole = payload.activeRole;
    } else if (isBoss && !hasRunnerProfile) {
      activeRole = 'BOSS';
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        activeRole,
        hasRunnerProfile,
        isBoss,
        canSwitch: hasRunnerProfile && isBoss, // 是否可以切换
        profile: user.runnerProfile,
      },
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
