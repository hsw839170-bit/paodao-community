import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from '@/lib/notifications';

/**
 * GET /api/notifications
 * 获取当前用户的通知列表
 * 
 * 查询参数:
 * - unreadOnly: boolean (默认 false) - 是否只返回未读通知
 * - limit: number (默认 20, 最大 100) - 返回数量限制
 * - offset: number (可选) - 传统 offset 分页
 * - cursor: string (可选) - 基于 createdAt 的游标分页，优先级高于 offset
 * 
 * 响应:
 * {
 *   notifications: [...],
 *   total: number,
 *   unreadCount: number,
 *   hasMore: boolean,
 *   nextCursor?: string
 * }
 */
export async function GET(request: NextRequest) {
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
    
    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offsetParam = searchParams.get('offset');
    const cursor = searchParams.get('cursor') || undefined;
    
    const offset = offsetParam !== null ? parseInt(offsetParam, 10) : undefined;
    
    // 3. 参数校验
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit 参数无效，应在 1-100 之间' },
        { status: 400 }
      );
    }
    
    if (offset !== undefined && (isNaN(offset) || offset < 0)) {
      return NextResponse.json(
        { error: 'offset 参数无效' },
        { status: 400 }
      );
    }
    
    // 4. 查询通知
    const result = await getNotifications({
      userId: payload.userId,
      unreadOnly,
      limit,
      offset,
      cursor
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('获取通知列表失败:', error);
    
    if (error instanceof Error && error.message === 'Token expired') {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '获取通知列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * 标记通知为已读
 * 
 * 请求体:
 * {
 *   action: 'markAsRead' | 'markAllAsRead',
 *   notificationId?: string (action=markAsRead 时必需)
 * }
 */
export async function POST(request: NextRequest) {
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
    
    // 2. 解析请求体
    const body = await request.json();
    const { action, notificationId } = body;
    
    if (!action || !['markAsRead', 'markAllAsRead'].includes(action)) {
      return NextResponse.json(
        { error: 'action 参数无效，应为 markAsRead 或 markAllAsRead' },
        { status: 400 }
      );
    }
    
    // 3. 执行操作
    if (action === 'markAsRead') {
      if (!notificationId) {
        return NextResponse.json(
          { error: 'notificationId 不能为空' },
          { status: 400 }
        );
      }
      
      const result = await markAsRead(notificationId, payload.userId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: '已标记为已读'
      });
      
    } else { // markAllAsRead
      const result = await markAllAsRead(payload.userId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `已标记 ${result.count} 条通知为已读`,
        count: result.count
      });
    }
    
  } catch (error) {
    console.error('标记通知已读失败:', error);
    
    if (error instanceof Error && error.message === 'Token expired') {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}
