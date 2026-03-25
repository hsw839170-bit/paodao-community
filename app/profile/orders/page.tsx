'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  userId: string;
  runnerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  amount: number;
  gameAmount: number | null;
  note: string | null;
  progress: number;
  progressNote: string | null;
  createdAt: string;
  user: {
    id: string;
    phone: string;
  };
  review?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
  logs?: {
    id: string;
    action: string;
    message: string;
    progressFrom: number | null;
    progressTo: number | null;
    createdAt: string;
  }[];
}

interface OrderStats {
  PENDING?: number;
  ACCEPTED?: number;
  COMPLETED?: number;
  CANCELED?: number;
}

interface DebugInfo {
  runnerId: string;
  userId: string;
  totalOrdersInDB: number;
  filteredOrders: number;
  queryStatus: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // 评价弹窗状态
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // 进度更新弹窗状态
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressOrder, setProgressOrder] = useState<Order | null>(null);
  const [progressForm, setProgressForm] = useState({ progress: 50, note: '' });
  const [submittingProgress, setSubmittingProgress] = useState(false);
  
  // 日志弹窗状态
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsOrder, setLogsOrder] = useState<Order | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  // 查看订单详情
  const handleViewDetail = (orderId: string) => {
    router.push(`/profile/orders/${orderId}`);
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = filter === 'ALL' 
        ? '/api/runners/orders' 
        : `/api/runners/orders?status=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          throw new Error('您不是跑手，无法查看订单');
        }
        throw new Error('获取订单失败');
      }

      const data = await response.json();
      setOrders(data.orders);
      setStats(data.stats);
      setDebug(data.debug);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 接单
  const handleAccept = async (orderId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setActionLoading(orderId);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '接单失败');
      }

      await fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 完成订单
  const handleComplete = async (orderId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setActionLoading(orderId);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '完成订单失败');
      }

      await fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 打开评价弹窗
  const openReviewModal = (order: Order) => {
    setReviewOrder(order);
    setReviewForm({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  // 提交评价
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setSubmittingReview(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${reviewOrder.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reviewForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '评价失败');
      }

      setShowReviewModal(false);
      setReviewOrder(null);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // 打开进度更新弹窗
  const openProgressModal = (order: Order) => {
    setProgressOrder(order);
    setProgressForm({ progress: order.progress || 10, note: order.progressNote || '' });
    setShowProgressModal(true);
  };

  // 提交进度更新
  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressOrder) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setSubmittingProgress(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${progressOrder.id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(progressForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新进度失败');
      }

      setShowProgressModal(false);
      setProgressOrder(null);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingProgress(false);
    }
  };

  // 获取订单日志
  const fetchOrderLogs = async (order: Order) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingLogs(true);
    setLogsOrder(order);
    setShowLogsModal(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('获取日志失败');

      const data = await response.json();
      setLogs(data.logs);
    } catch (err) {
      console.error('获取日志失败:', err);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { text: string; className: string }> = {
      PENDING: { text: '待接单', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      ACCEPTED: { text: '已接单', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      IN_PROGRESS: { text: '进行中', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      COMPLETED: { text: '已完成', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      CANCELED: { text: '已取消', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    };
    const c = config[status] || config.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${c.className}`}>
        {c.text}
      </span>
    );
  };

  // 渲染星级评分
  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
            className={`text-2xl ${interactive ? 'hover:scale-110 transition cursor-pointer' : ''} ${
              star <= rating ? 'text-yellow-400' : 'text-slate-600'
            }`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        加载中...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 导航栏 */}
        <nav className="flex justify-center gap-4 mb-8">
          <Link href="/" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            首页
          </Link>
          <Link href="/leaderboard" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            排行榜
          </Link>
          <Link href="/profile" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            个人中心
          </Link>
          <Link href="/profile/orders" className="px-6 py-2.5 bg-blue-600 rounded-full text-white font-medium">
            我的订单
          </Link>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">我的订单</h1>
          <p className="text-slate-400">管理您接收的订单</p>
        </div>

        {/* 调试信息面板 */}
        {debug && (
          <div className="mb-6">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              {showDebug ? '隐藏调试信息' : '显示调试信息'}
            </button>
            
            {showDebug && (
              <div className="mt-2 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-xs font-mono text-slate-400">
                <div>Runner ID: {debug.runnerId}</div>
                <div>User ID: {debug.userId}</div>
                <div>数据库中总订单数: {debug.totalOrdersInDB}</div>
                <div>当前筛选订单数: {debug.filteredOrders}</div>
                <div>当前筛选条件: {debug.queryStatus}</div>
                <div className="mt-2 text-yellow-500">
                  {debug.totalOrdersInDB === 0 && '⚠️ 数据库中没有属于您的订单'}
                  {debug.totalOrdersInDB > 0 && debug.filteredOrders === 0 && '⚠️ 有订单但被当前筛选条件过滤'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { key: 'PENDING', label: '待接单', count: stats.PENDING || 0 },
            { key: 'ACCEPTED', label: '进行中', count: stats.ACCEPTED || 0 },
            { key: 'COMPLETED', label: '已完成', count: stats.COMPLETED || 0 },
            { key: 'ALL', label: '全部', count: Object.values(stats).reduce((a, b) => (a as number) + (b as number), 0) },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`p-4 rounded-xl border transition ${
                filter === item.key
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-sm text-slate-400">{item.label}</div>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* 订单列表 */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-bold mb-2">暂无订单</h3>
              <p className="text-slate-400">
                {filter === 'ALL' 
                  ? '还没有人向您下单，保持在线状态等待老板吧！'
                  : '该状态下暂无订单'}
              </p>
              <Link 
                href="/profile/edit" 
                className="inline-block mt-4 px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
              >
                修改在线状态
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => handleViewDetail(order.id)}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="text-slate-500 text-sm">
                      {new Date(order.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ¥{order.amount}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-slate-500 text-sm">客户联系方式</label>
                    <div className="font-mono">{order.user.phone}</div>
                  </div>
                  {order.gameAmount && (
                    <div>
                      <label className="text-slate-500 text-sm">游戏币数量</label>
                      <div>{order.gameAmount} 万</div>
                    </div>
                  )}
                </div>

                {order.note && (
                  <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                    <label className="text-slate-500 text-sm">备注</label>
                    <p className="text-slate-300">{order.note}</p>
                  </div>
                )}

                {/* 进度条 - 进行中订单显示 */}
                {(order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS') && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>{order.progressNote || '进行中...'}</span>
                      <span>{order.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 评价展示 */}
                {order.review && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-400 text-sm">客户评价：</span>
                      {renderStars(order.review.rating)}
                    </div>
                    {order.review.comment && (
                      <p className="text-slate-300">"{order.review.comment}"</p>
                    )}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                  {order.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleAccept(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex-1 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition disabled:opacity-50"
                      >
                        {actionLoading === order.id ? '处理中...' : '接单'}
                      </button>
                      <button className="flex-1 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition">
                        拒绝
                      </button>
                    </>
                  )}
                  {order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS' ? (
                    <>
                      <button 
                        onClick={() => openProgressModal(order)}
                        className="flex-1 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
                      >
                        更新进度
                      </button>
                      <button 
                        onClick={() => handleComplete(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex-1 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition disabled:opacity-50"
                      >
                        {actionLoading === order.id ? '处理中...' : '标记完成'}
                      </button>
                    </>
                  ) : null}
                  
                  {/* 查看轨迹按钮 */}
                  {(order.status !== 'PENDING' && order.status !== 'CANCELED') && (
                    <button
                      onClick={() => fetchOrderLogs(order)}
                      className="w-full mt-2 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      查看轨迹
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 评价弹窗 */}
      {showReviewModal && reviewOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">评价订单</h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  评分
                </label>
                {renderStars(reviewForm.rating, true, (r) => setReviewForm({ ...reviewForm, rating: r }))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  评价内容
                </label>
                <textarea
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="分享您的服务体验..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold disabled:opacity-50"
              >
                {submittingReview ? '提交中...' : '提交评价'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 进度更新弹窗 */}
      {showProgressModal && progressOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">更新订单进度</h3>
              <button
                onClick={() => setShowProgressModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProgress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  当前进度: {progressForm.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressForm.progress}
                  onChange={(e) => setProgressForm({ ...progressForm, progress: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  进度说明
                </label>
                <input
                  type="text"
                  value={progressForm.note}
                  onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="例如：正在匹配对局中..."
                />
              </div>

              <div className="text-xs text-slate-500">
                💡 提示：进度达到 100% 时订单将自动标记为完成
              </div>

              <button
                type="submit"
                disabled={submittingProgress}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold disabled:opacity-50"
              >
                {submittingProgress ? '更新中...' : '更新进度'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 日志弹窗 */}
      {showLogsModal && logsOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">订单轨迹</h3>
                <p className="text-sm text-slate-400">¥{logsOrder.amount}</p>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-[50vh] space-y-3">
              {loadingLogs ? (
                <div className="text-center py-8 text-slate-400">加载中...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">暂无轨迹记录</div>
              ) : (
                logs.map((log, index) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 'bg-slate-600'
                      }`} />
                      {index < logs.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-700 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{log.message}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {log.actorType === 'RUNNER' ? '跑手' : log.actorType === 'BOSS' ? '老板' : '系统'}
                        {log.progressFrom !== null && log.progressTo !== null && (
                          <span className="ml-2 text-blue-400">
                            进度: {log.progressFrom}% → {log.progressTo}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
