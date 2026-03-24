'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  userId: string;
  runnerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELED';
  amount: number;
  gameAmount: number | null;
  note: string | null;
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
}

interface OrderStats {
  PENDING?: number;
  ACCEPTED?: number;
  COMPLETED?: number;
  CANCELED?: number;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // 评价弹窗状态
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

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
        ? '/api/runners/orders/' 
        : `/api/runners/orders/?status=${filter}`;
      
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
      const response = await fetch(`/api/orders/${orderId}/accept/`, {
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
      const response = await fetch(`/api/orders/${orderId}/complete/`, {
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
      const response = await fetch(`/api/orders/${reviewOrder.id}/review/`, {
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { text: string; className: string }> = {
      PENDING: { text: '待接单', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      ACCEPTED: { text: '进行中', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
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
          <Link href="/leaderboard/" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            排行榜
          </Link>
          <Link href="/profile/" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            个人中心
          </Link>
          <Link href="/profile/orders/" className="px-6 py-2.5 bg-blue-600 rounded-full text-white font-medium">
            我的订单
          </Link>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">我的订单</h1>
          <p className="text-slate-400">管理您接收的订单</p>
        </div>

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
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition"
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
                <div className="flex gap-3">
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
                  {order.status === 'ACCEPTED' && (
                    <button 
                      onClick={() => handleComplete(order.id)}
                      disabled={actionLoading === order.id}
                      className="flex-1 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition disabled:opacity-50"
                    >
                      {actionLoading === order.id ? '处理中...' : '标记完成'}
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
    </main>
  );
}
