'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  amount: number;
  gameAmount: number | null;
  note: string | null;
  progress: number;
  progressNote: string | null;
  createdAt: string;
  updatedAt: string;
  runner: {
    id: string;
    nickname: string;
    avatar: string | null;
    phone: string;
    platform: string;
  };
  review?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

interface OrderLog {
  id: string;
  action: string;
  message: string;
  actorType: string;
  progressFrom: number | null;
  progressTo: number | null;
  createdAt: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 评价弹窗
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 获取订单列表并找到当前订单
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        throw new Error('获取订单详情失败');
      }

      const data = await response.json();
      const foundOrder = data.orders.find((o: Order) => o.id === orderId);
      
      if (!foundOrder) {
        setError('订单不存在');
        setLoading(false);
        return;
      }
      
      setOrder(foundOrder);
      
      // 获取订单日志
      const logsResponse = await fetch(`/api/orders/${orderId}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData.logs);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 提交评价
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setSubmittingReview(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${order.id}/review`, {
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
      await fetchOrderDetail();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingReview(false);
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${c.className}`}>
        {c.text}
      </span>
    );
  };

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

  const getPlatformText = (platform: string) => {
    const map: Record<string, string> = { PC: '端游', MOBILE: '手游', BOTH: '两者都可' };
    return map[platform] || platform;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        加载中...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
          <div className="text-red-400 mb-4">{error || '订单不存在'}</div>
          <Link href="/my-orders" className="text-blue-400 hover:underline">
            ← 返回我的订单
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 导航栏 */}
        <nav className="flex justify-center gap-4 mb-8">
          <Link href="/" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            首页
          </Link>
          <Link href="/my-orders" className="px-6 py-2.5 bg-blue-600 rounded-full text-white font-medium">
            我的下单
          </Link>
        </nav>

        <Link href="/my-orders" className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回订单列表
        </Link>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">订单详情</h1>
            {getStatusBadge(order.status)}
          </div>

          {/* 跑手信息 */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-700/50 rounded-xl">
            {order.runner.avatar ? (
              <img src={order.runner.avatar} alt={order.runner.nickname} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
                {order.runner.nickname[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="font-bold text-lg">{order.runner.nickname}</div>
              <div className="text-slate-400 text-sm">{getPlatformText(order.runner.platform)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">¥{order.amount}</div>
            </div>
          </div>

          {/* 进度条 */}
          {(order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS') && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>{order.progressNote || '进行中...'}</span>
                <span className="font-bold text-white">{order.progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${order.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 订单信息 */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">订单编号</span>
              <span className="font-mono text-sm">{order.id.slice(0, 8)}...{order.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">下单时间</span>
              <span>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            {order.gameAmount && (
              <div className="flex justify-between">
                <span className="text-slate-400">游戏币数量</span>
                <span>{order.gameAmount} 万</span>
              </div>
            )}
            {order.note && (
              <div className="pt-3 border-t border-slate-700">
                <div className="text-slate-400 mb-1">订单备注</div>
                <div className="bg-slate-700/50 rounded-lg p-3">{order.note}</div>
              </div>
            )}
          </div>

          {/* 跑手联系方式（接单后显示） */}
          {(order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="text-green-400 font-medium mb-2">跑手联系方式</div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-mono text-lg">{order.runner.phone}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">请添加微信联系跑手，备注订单号</p>
            </div>
          )}

          {/* 评价区域 */}
          {order.status === 'COMPLETED' && (
            order.review ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-400">我的评价</span>
                  {renderStars(order.review.rating)}
                </div>
                {order.review.comment && (
                  <p className="text-slate-300">"{order.review.comment}"</p>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full py-3 bg-yellow-600/80 rounded-lg hover:bg-yellow-500 transition"
              >
                ⭐ 评价本次服务
              </button>
            )
          )}
        </div>

        {/* 订单轨迹 */}
        {logs.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-6">订单轨迹</h2>
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-slate-600'}`} />
                    {index < logs.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.message}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {log.actorType === 'RUNNER' ? '跑手' : log.actorType === 'BOSS' ? '老板' : '系统'}
                      {log.progressFrom !== null && log.progressTo !== null && (
                        <span className="ml-2 text-blue-400">进度: {log.progressFrom}% → {log.progressTo}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 评价弹窗 */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">评价跑手</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">评分</label>
                {renderStars(reviewForm.rating, true, (r) => setReviewForm({ ...reviewForm, rating: r }))}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">评价内容</label>
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
