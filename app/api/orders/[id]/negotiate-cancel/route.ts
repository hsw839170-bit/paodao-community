import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

/**
 * PUT /api/orders/[id]/negotiate-cancel
 * 协商取消订单（老板/跑手双方发起）（接口占位符，暂未启用）
 * 
 * TODO: 此接口为预留接口，当前仅做参数校验，不实际修改订单状态
 * 需要后续补充：
 * 1. 协商流程设计（一方发起 → 另一方确认 → 取消完成）
 * 2. 取消原因分类与责任判定
 * 3. 赔付/补偿机制（如果有）
 * 4. 信用分影响规则
 * 
 * 与 /abandon 的区别：
 * - /abandon: 跑手单方放弃（可能需要惩罚）
 * - /negotiate-cancel: 双方协商一致取消（无惩罚或轻惩罚）
 * 
 * 预期使用场景：
 * - 老板/跑手沟通后，双方同意取消订单
 * - 记录取消原因，用于责任判定
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

    // 2. 获取请求数据
    const body = await request.json();
    const { 
      reason, 
      reasonType, 
      initiatorRole, // 'BOSS' | 'RUNNER'
      proposedSettlement // 提议的解决方案
    } = body;

    // 3. 参数校验
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: '请提供取消原因' },
        { status: 400 }
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { error: '取消原因不能超过 500 字符' },
        { status: 400 }
      );
    }

    const validReasonTypes = [
      'MUTUAL_AGREEMENT',    // 双方协商一致
      'TIME_ISSUE',          // 时间问题
      'AMOUNT_DISPUTE',      // 金额争议
      'SERVICE_ISSUE',       // 服务问题
      'FORCE_MAJEURE',       // 不可抗力
      'OTHER'
    ];

    if (reasonType && !validReasonTypes.includes(reasonType)) {
      return NextResponse.json(
        { error: '无效的原因类型', validTypes: validReasonTypes },
        { status: 400 }
      );
    }

    if (!initiatorRole || !['BOSS', 'RUNNER'].includes(initiatorRole)) {
      return NextResponse.json(
        { error: '请指定发起方角色（BOSS 或 RUNNER）' },
        { status: 400 }
      );
    }

    // 4. 查询订单
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        runner: true,
        user: { select: { id: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 5. 验证发起方身份
    const isBoss = order.user.id === payload.userId;
    const isRunner = order.runner?.userId === payload.userId;

    if (!isBoss && !isRunner) {
      return NextResponse.json(
        { error: '您无权操作此订单' },
        { status: 403 }
      );
    }

    // 验证角色声明与实际身份一致
    if (initiatorRole === 'BOSS' && !isBoss) {
      return NextResponse.json(
        { error: '您不是订单老板' },
        { status: 403 }
      );
    }
    if (initiatorRole === 'RUNNER' && !isRunner) {
      return NextResponse.json(
        { error: '您不是订单接单跑手' },
        { status: 403 }
      );
    }

    // 6. 验证订单状态
    const allowedStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { 
          error: '订单状态不允许协商取消',
          currentStatus: order.status,
          allowedStatuses
        },
        { status: 400 }
      );
    }

    // TODO: 以下为占位逻辑，实际业务逻辑待定
    // ============================================================
    // 需要讨论确定的协商流程：
    //
    // 方案 A: 简单确认制
    //   1. 一方发起取消请求
    //   2. 另一方收到通知，确认同意
    //   3. 订单取消完成
    //   - 优点：简单直接
    //   - 缺点：可能存在一方拖延确认
    //
    // 方案 B: 超时自动确认制
    //   1. 一方发起取消请求
    //   2. 另一方 24 小时内确认或拒绝
    //   3. 超时未响应则自动取消（或自动拒绝）
    //   - 优点：防止拖延
    //   - 缺点：可能误伤
    //
    // 方案 C: 平台介入制（复杂）
 //   1. 一方发起取消请求
    //   2. 另一方确认/拒绝
    //   3. 如有争议，平台介入判定
    //   - 优点：公平
    //   - 缺点：成本高
    //
    // 需要配套的规则：
    // - 取消原因与责任判定
    // - 信用分影响（根据责任方）
    // - 是否允许重新接单（跑手端）
    // - 是否允许重新发布（老板端）
    // ============================================================

    // 确定另一方信息
    const otherParty = initiatorRole === 'BOSS' 
      ? { role: 'RUNNER', id: order.runner?.id }
      : { role: 'BOSS', id: order.user.id };

    // 占位返回：模拟成功响应，但实际不修改数据库
    return NextResponse.json({
      success: true,
      message: '【接口占位符】协商取消请求已记录（暂未实际执行）',
      note: '此接口为预留接口，协商流程与赔付逻辑待定',
      order: {
        id: order.id,
        status: order.status,
        wouldChangeTo: 'NEGOTIATING → CANCELED (流程待定)',
      },
      cancelRequest: {
        reason,
        reasonType: reasonType || 'OTHER',
        initiator: initiatorRole,
        initiatorUserId: payload.userId,
        otherParty,
        proposedSettlement,
        timestamp: new Date().toISOString(),
        status: 'PENDING_OTHER_PARTY_CONFIRMATION',
        estimatedResponseTime: '24小时（待定）',
      },
      nextSteps: [
        `等待${otherParty.role === 'BOSS' ? '老板' : '跑手'}确认`,
        '双方确认后订单取消',
        '根据责任判定信用分影响'
      ],
      // 预期响应示例（实际实现后返回）
      // actualResponse: {
      //   success: true,
      //   message: '协商取消已发起，等待对方确认',
      //   cancelRequest: { id, status: 'WAITING_CONFIRMATION' },
      //   expiresAt: '2024-03-26T22:00:00Z'
      // }
    });

  } catch (error) {
    console.error('协商取消接口错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/[id]/negotiate-cancel
 * 获取协商取消的状态和选项（接口占位符）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 占位：返回协商取消的选项和说明
  return NextResponse.json({
    note: '【接口占位符】协商取消功能尚未启用',
    available: false,
    reasonTypes: [
      { value: 'MUTUAL_AGREEMENT', label: '双方协商一致', penalty: 'none' },
      { value: 'TIME_ISSUE', label: '时间问题', penalty: 'light' },
      { value: 'AMOUNT_DISPUTE', label: '金额争议', penalty: 'depends' },
      { value: 'SERVICE_ISSUE', label: '服务问题', penalty: 'depends' },
      { value: 'FORCE_MAJEURE', label: '不可抗力', penalty: 'none' },
      { value: 'OTHER', label: '其他原因', penalty: 'light' },
    ],
    process: {
      steps: [
        '一方发起协商取消请求',
        '另一方收到通知，确认或拒绝',
        '双方确认后订单取消',
        '根据责任判定信用分影响'
      ],
      estimatedTime: '24小时内完成',
    },
    warning: '请与订单另一方充分沟通后再发起协商取消',
  });
}
