/**
 * 通知系统工具函数
 * 
 * 设计原则：
 * 1. 写通知失败不应影响主业务流程（try-catch + 日志记录）
 * 2. 权限校验：确保发送者有权限向目标用户发送通知
 * 3. 目标用户合法性校验：确保 userId 存在且有效
 */

import { prisma } from './prisma';

export type NotificationType = 
  | 'ORDER_CREATED'      // 老板创建订单，通知跑手（PRIVATE模式）
  | 'ORDER_CLAIMED'      // 跑手抢单成功，通知老板
  | 'ORDER_ACCEPTED'     // 跑手接单，通知老板
  | 'ORDER_COMPLETED'    // 订单完成，通知对方
  | 'ORDER_CANCELLED'    // 订单取消，通知对方
  | 'PROGRESS_UPDATED';  // 进度更新，通知老板

interface CreateNotificationOptions {
  type: NotificationType;
  userId: string;      // 接收通知的用户ID
  title: string;
  message: string;
  orderId?: string;
  actorId?: string;    // 触发通知的用户ID（用于权限校验）
}

interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  code?: 'UNAUTHORIZED' | 'INVALID_USER' | 'DB_ERROR' | 'UNKNOWN';
}

/**
 * 校验用户是否有权限向目标用户发送通知
 * 
 * 规则：
 * 1. 系统通知（无actorId）：允许
 * 2. 订单相关通知：发送者必须是订单的参与方（老板或跑手）
 * 3. 不能给自己发通知（可选，根据业务需求调整）
 */
async function checkPermission(
  options: CreateNotificationOptions
): Promise<{ allowed: boolean; reason?: string }> {
  const { userId, actorId, orderId, type } = options;
  
  // 系统通知（无触发者）允许
  if (!actorId) {
    return { allowed: true };
  }
  
  // 不能给自己发通知
  if (actorId === userId) {
    return { allowed: false, reason: '不能向自己发送通知' };
  }
  
  // 订单相关通知需要校验订单参与关系
  if (orderId && type.startsWith('ORDER_')) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true, runnerId: true }
      });
      
      if (!order) {
        return { allowed: false, reason: '订单不存在' };
      }
      
      // 获取跑手的 userId（因为 order.runnerId 是 RunnerProfile.id）
      let runnerUserId: string | null = null;
      if (order.runnerId) {
        const runnerProfile = await prisma.runnerProfile.findUnique({
          where: { id: order.runnerId },
          select: { userId: true }
        });
        runnerUserId = runnerProfile?.userId || null;
      }
      
      // 发送者必须是老板或跑手之一
      const isBoss = actorId === order.userId;
      const isRunner = actorId === runnerUserId;
      
      if (!isBoss && !isRunner) {
        return { allowed: false, reason: '无权操作此订单' };
      }
      
      // 接收者必须是另一方
      const targetIsBoss = userId === order.userId;
      const targetIsRunner = userId === runnerUserId;
      
      if (!targetIsBoss && !targetIsRunner) {
        return { allowed: false, reason: '目标用户不是订单参与方' };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('[Notification] 权限校验查询失败:', error);
      return { allowed: false, reason: '权限校验异常' };
    }
  }
  
  return { allowed: true };
}

/**
 * 校验目标用户是否存在且有效
 */
async function validateTargetUser(userId: string): Promise<{ valid: boolean; exists?: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    return { valid: !!user, exists: !!user };
  } catch (error) {
    console.error('[Notification] 用户合法性校验失败:', error);
    return { valid: false, exists: false };
  }
}

/**
 * 创建通知
 * 
 * 特性：
 * - 权限校验失败 → 返回 UNAUTHORIZED，不创建通知
 * - 目标用户不存在 → 返回 INVALID_USER，不创建通知  
 * - 数据库错误 → 返回 DB_ERROR，记录日志，不抛出异常
 * - 未知错误 → 返回 UNKNOWN，记录日志，不抛出异常
 * 
 * 重要：此函数不会抛出异常，调用方无需 try-catch
 */
export async function createNotification(
  options: CreateNotificationOptions
): Promise<NotificationResult> {
  const startTime = Date.now();
  
  try {
    // 1. 权限校验
    const permission = await checkPermission(options);
    if (!permission.allowed) {
      console.warn('[Notification] 权限校验失败:', {
        type: options.type,
        targetUserId: options.userId,
        actorId: options.actorId,
        reason: permission.reason
      });
      return {
        success: false,
        error: permission.reason,
        code: 'UNAUTHORIZED'
      };
    }
    
    // 2. 目标用户合法性校验
    const userValidation = await validateTargetUser(options.userId);
    if (!userValidation.valid) {
      console.warn('[Notification] 目标用户不存在:', {
        type: options.type,
        targetUserId: options.userId,
        exists: userValidation.exists
      });
      return {
        success: false,
        error: '目标用户不存在',
        code: 'INVALID_USER'
      };
    }
    
    // 3. 创建通知
    const notification = await prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        orderId: options.orderId,
        read: false
      }
    });
    
    const duration = Date.now() - startTime;
    console.log('[Notification] 创建成功:', {
      notificationId: notification.id,
      type: options.type,
      targetUserId: options.userId,
      duration: `${duration}ms`
    });
    
    return {
      success: true,
      notificationId: notification.id
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    console.error('[Notification] 创建失败:', {
      type: options.type,
      targetUserId: options.userId,
      error: errorMessage,
      duration: `${duration}ms`
    });
    
    return {
      success: false,
      error: errorMessage,
      code: 'DB_ERROR'
    };
  }
}

/**
 * 批量创建通知（用于需要通知多个用户的场景）
 * 
 * 特性：
 * - 单个通知失败不影响其他通知
 * - 返回每个通知的结果详情
 */
export async function createNotificationsBatch(
  optionsList: CreateNotificationOptions[]
): Promise<{ total: number; success: number; failed: number; results: NotificationResult[] }> {
  const results = await Promise.all(
    optionsList.map(opt => createNotification(opt))
  );
  
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('[Notification] 批量创建完成:', {
    total: optionsList.length,
    success,
    failed
  });
  
  return {
    total: optionsList.length,
    success,
    failed,
    results
  };
}

/**
 * 获取通知列表（支持分页）
 */
export interface GetNotificationsOptions {
  userId: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  cursor?: string;  // 基于 createdAt 的游标
}

export interface NotificationsResult {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    orderId: string | null;
    read: boolean;
    createdAt: Date;
  }>;
  total: number;
  unreadCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export async function getNotifications(
  options: GetNotificationsOptions
): Promise<NotificationsResult> {
  const { userId, unreadOnly = false, limit = 20, offset, cursor } = options;
  
  const take = Math.min(limit, 100); // 最大100条
  
  // 构建 where 条件
  const where: any = { userId };
  if (unreadOnly) {
    where.read = false;
  }
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }
  
  // 查询通知
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: take + 1, // 多取一条用于判断 hasMore
    ...(offset !== undefined && { skip: offset })
  });
  
  // 判断是否还有更多
  const hasMore = notifications.length > take;
  if (hasMore) {
    notifications.pop(); // 移除多取的那条
  }
  
  // 计算游标
  const nextCursor = hasMore && notifications.length > 0
    ? notifications[notifications.length - 1].createdAt.toISOString()
    : undefined;
  
  // 查询未读总数（用于红点提示）
  const unreadCount = await prisma.notification.count({
    where: { userId, read: false }
  });
  
  // 查询总数量（用于 offset 分页）
  const total = await prisma.notification.count({
    where: { userId }
  });
  
  return {
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      orderId: n.orderId,
      read: n.read,
      createdAt: n.createdAt
    })),
    total,
    unreadCount,
    hasMore,
    nextCursor
  };
}

/**
 * 标记通知为已读
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });
    
    if (!notification) {
      return { success: false, error: '通知不存在或无权限' };
    }
    
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('[Notification] 标记已读失败:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 标记用户所有通知为已读
 */
export async function markAllAsRead(
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    
    console.log('[Notification] 全部标记已读:', {
      userId,
      count: result.count
    });
    
    return { success: true, count: result.count };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('[Notification] 标记全部已读失败:', errorMessage);
    return { success: false, count: 0, error: errorMessage };
  }
}

/**
 * 删除已读通知（定期清理用）
 */
export async function deleteReadNotifications(
  userId: string,
  olderThanDays: number = 30
): Promise<{ success: boolean; count: number }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
        createdAt: { lt: cutoffDate }
      }
    });
    
    console.log('[Notification] 清理已读通知:', {
      userId,
      olderThanDays,
      deleted: result.count
    });
    
    return { success: true, count: result.count };
  } catch (error) {
    console.error('[Notification] 清理已读通知失败:', error);
    return { success: false, count: 0 };
  }
}
