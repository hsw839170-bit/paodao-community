/**
 * 通知系统 Stub
 * 
 * 当前实现：仅记录到数据库
 * 未来扩展：WebSocket 实时推送、短信通知
 */

import { prisma } from './prisma';

type NotificationType = 'ORDER_CLAIMED' | 'ORDER_COMPLETED' | 'ORDER_CANCELLED';

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
}

/**
 * 创建通知记录
 * 
 * TODO: 扩展实现
 * - [ ] WebSocket 实时推送
 * - [ ] 短信通知（重要事件）
 * - [ ] 推送通知（PWA）
 * - [ ] 邮件通知
 */
export async function createNotification(data: NotificationData) {
  try {
    // 1. 写入数据库
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        orderId: data.orderId,
        read: false,
      },
    });

    console.log(`[Notification] Created for user ${data.userId}: ${data.title}`);

    // 2. TODO: WebSocket 推送（未来实现）
    // await websocketServer.sendToUser(data.userId, {
    //   type: 'NEW_NOTIFICATION',
    //   data: notification,
    // });

    // 3. TODO: 短信通知（重要事件）
    // if (data.type === 'ORDER_CLAIMED') {
    //   await sendSMS(data.userId, data.message);
    // }

    return notification;
  } catch (error) {
    console.error('[Notification] Failed to create:', error);
    // 通知失败不应影响主流程
    return null;
  }
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

/**
 * 获取用户未读通知数
 */
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}
