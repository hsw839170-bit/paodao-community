import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

/**
 * PUT /api/orders/[id]/abandon
 * 跑手放弃已接单的订单（接口占位符，暂未启用）
 * 
 * TODO: 此接口为预留接口，当前仅做参数校验，不实际修改订单状态
 * 需要后续补充：
 * 1. 订单状态机设计（ACCEPTED → ABANDONED? / 回退到 PENDING?）
 * 2. 跑手信用分/惩罚机制
 * 3. 通知老板的逻辑
 * 4. 赔付规则（如果有）
 * 
 * 预期使用场景：
 * - 跑手接单后发现无法完成，主动放弃
 * - 需要记录放弃原因，用于信用评估
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证登录
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    // 2. 获取请求数据（放弃原因）
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: '请提供放弃原因' },
        { status: 400 }
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { error: '放弃原因不能超过 500 字符' },
        { status: 400 }
      );
    }

    // 3. 查询订单
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        runner: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 4. 验证当前用户是接单的跑手
    if (!order.runner || order.runner.userId !== payload.userId) {
      return NextResponse.json(
        { error: '您不是该订单的接单跑手' },
        { status: 403 }
      );
    }

    // 5. 验证订单状态
    if (order.status !== 'ACCEPTED') {
      return NextResponse.json(
        { 
          error: '订单状态不允许放弃',
          currentStatus: order.status,
          allowedStatuses: ['ACCEPTED']
        },
        { status: 400 }
      );
    }

    // TODO: 以下为占位逻辑，实际业务逻辑待定
    // ============================================================
    // 需要讨论确定的状态流转方案：
    //
    // 方案 A: 订单回退到 PENDING，重新进入抢单池
    //   - 优点：订单不浪费，其他跑手可接
    //   - 缺点：老板可能不满，需要通知老板
    //
    // 方案 B: 订单进入特殊状态 ABANDONED，需要老板确认
    //   - 优点：老板有知情权
    //   - 缺点：流程复杂，需要老板操作
    //
    // 方案 C: 订单标记为 CANCELED，释放跑手状态
    //   - 优点：简单直接
    //   - 缺点：订单彻底取消，可能需要重新发布
    //
    // 需要配套的惩罚机制：
    // - 首次放弃：警告
    // - 多次放弃：限制接单权限 / 降低信用分
    // - 恶意放弃：封号
    // ============================================================

    // 占位返回：模拟成功响应，但实际不修改数据库
    return NextResponse.json({
      success: true,
      message: '【接口占位符】放弃订单请求已记录（暂未实际执行）',
      note: '此接口为预留接口，状态机与赔付逻辑待定',
      order: {
        id: order.id,
        status: order.status,
        wouldChangeTo: 'PENDING or ABANDONED or CANCELED (待定)',
      },
      abandonRequest: {
        reason,
        runnerId: order.runner.id,
        timestamp: new Date().toISOString(),
        status: 'PENDING_IMPLEMENTATION',
      },
      // 预期响应示例（实际实现后返回）
      // actualResponse: {
      //   success: true,
      //   message: '已放弃订单',
      //   order: { id, status: 'PENDING' or 'ABANDONED' },
      //   penalty: { type: 'WARNING', creditScoreChange: -5 }
      // }
    });

  } catch (error) {
    console.error('放弃订单接口错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/[id]/abandon
 * 获取放弃订单的选项和说明（接口占位符）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 占位：返回放弃原因的预设选项
  return NextResponse.json({
    note: '【接口占位符】放弃订单功能尚未启用',
    available: false,
    reasonOptions: [
      { value: 'TIME_CONFLICT', label: '时间冲突，无法按时完成' },
      { value: 'AMOUNT_TOO_LARGE', label: '订单金额过大，能力不足' },
      { value: 'PLATFORM_MISMATCH', label: '平台不匹配（端游/手游）' },
      { value: 'PERSONAL_REASON', label: '个人原因' },
      { value: 'OTHER', label: '其他原因' },
    ],
    warning: '放弃订单可能影响您的信用评分，请谨慎操作',
  });
}
