'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { 
  UserCheck, 
  Zap, 
  Package, 
  Clock, 
  CheckCircle,
  ChevronRight,
  Search,
  PlusCircle
} from 'lucide-react';

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

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  
  // 评价弹窗状态
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // 日志弹窗状态
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsOrder, setLogsOrder] = useState<Order | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
        ? '/api/orders' 
        : `/api/orders?status=${filter}`;
      
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

  // 计算订单超时倒计时（ACCEPTED 状态 24 小时后自动完成）
  const getTimeoutCountdown = (order: Order): { text: string; isWarning: boolean } | null => {
    if (order.status !== 'ACCEPTED') return null;
    
    const ACCEPTED_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 小时
    const updatedAt = new Date(order.updatedAt).getTime();
    const expireAt = updatedAt + ACCEPTED_TIMEOUT_MS;
    const now = Date.now();
    const remaining = expireAt - now;
    
    if (remaining <= 0) {
      return { text: '即将自动完成', isWarning: true };
    }
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    // 剩余小于 4 小时显示警告
    const isWarning = hours < 4;
    
    if (hours > 0) {
      return { text: `${hours}小时${minutes}分后自动完成`, isWarning };
    } else {
      return { text: `${minutes}分后自动完成`, isWarning: true };
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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 导航栏 */}
        <Navbar isRunnerMode={false} />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">我的下单</h1>
          <p className="text-slate-400">管理您的订单，查看进度和评价</p>
        </div>

      {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { 
              key: 'PENDING', 
              label: '待接单', 
              count: stats.PENDING || 0,
              icon: Package,
              desc: '等待跑手接单',
              color: 'text-yellow-400'
            },
            { 
              key: 'ACCEPTED', 
              label: '进行中', 
              count: stats.ACCEPTED || 0,
              icon: Clock,
              desc: '跑手正在服务',
              color: 'text-blue-400'
            },
            { 
              key: 'COMPLETED', 
              label: '已完成', 
              count: stats.COMPLETED || 0,
              icon: CheckCircle,
              desc: '订单已结束',
              color: 'text-green-400'
            },
            { 
              key: 'ALL', 
              label: '全部', 
              count: Object.values(stats).reduce((a, b) => (a as number) + (b as number), 0),
              icon: Package,
              desc: '所有历史订单',
              color: 'text-purple-400'
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`p-4 rounded-2xl border transition text-left ${
                filter === item.key
                  ? 'bg-blue-600/20 border-blue-500'
                  : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className={`text-2xl font-bold ${filter === item.key ? 'text-white' : 'text-slate-200'}`}>
                  {item.count}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-300">{item.label}</div>
              <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* 下单操作区 */}
        <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-orange-600/10 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                快速下单
              </h3>
              <p className="text-slate-400 text-sm">
                您可以选择心仪的跑手直接下单，或将订单发布到抢单大厅让跑手来抢单
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-medium text-white hover:from-blue-500 hover:to-blue-400 transition shadow-lg shadow-blue-600/20"
              >
                <UserCheck className="w-4 h-4" />
                指定跑手下单
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/create-order?mode=PUBLIC"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-medium text-white hover:from-orange-400 hover:to-red-400 transition shadow-lg shadow-orange-500/20"
              >
                <Zap className="w-4 h-4" />
                发布到抢单大厅
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* 订单列表 */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">暂无订单</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                您还没有下单。您可以前往首页选择心仪的跑手下单，或直接将订单发布到抢单大厅让跑手来抢单！
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link 
                  href="/" 
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition"
                >
                  <Search className="w-4 h-4" />
                  去找跑手
                </Link>
                <Link 
                  href="/create-order?mode=PUBLIC" 
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-xl font-medium transition shadow-lg shadow-orange-500/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  发布抢单
                </Link>
              </div>
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/my-orders/${order.id}`}
                className="block bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition cursor-pointer"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* 跑手头像 */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold">
                    {order.runner.avatar ? (
                      <img src={order.runner.avatar} alt={order.runner.nickname} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      order.runner.nickname[0]
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{order.runner.nickname}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        ¥{order.amount}
                      </div>
                    </div>                    
                    <div className="text-slate-500 text-sm mt-1">
                      {new Date(order.createdAt).toLocaleString('zh-CN')}
                    </div>
                    
                    {/* 进度条 - 进行中订单显示 */}
                    {(order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS') && (
                      <div className="mt-3">
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
                  </div>
                </div>

                {order.gameAmount && (
                  <div className="text-slate-400 text-sm mb-2">
                    游戏币：{order.gameAmount} 万
                  </div>
                )}

                {order.note && (
                  <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                    <p className="text-slate-300">{order.note}</p>
                  </div>
                )}

                {/* 超时倒计时（仅 ACCEPTED 状态） */}
                {order.status === 'ACCEPTED' && (() => {
                  const countdown = getTimeoutCountdown(order);
                  if (!countdown) return null;
                  return (
                    <div className={`text-xs mb-3 px-2 py-1 rounded-lg inline-block ${
                      countdown.isWarning 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      ⏰ {countdown.text}
                    </div>
                  );
                })()}

                {/* 评价展示 */}
                {order.review ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-400 text-sm">我的评价：</span>
                      {renderStars(order.review.rating)}
                    </div>
                    {order.review.comment && (
                      <p className="text-slate-300">"{order.review.comment}"</p>
                    )}
                  </div>
                ) : order.status === 'COMPLETED' ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openReviewModal(order);
                    }}
                    className="w-full py-2 bg-yellow-600/80 rounded-lg hover:bg-yellow-500 transition"
                  >
                    ⭐ 评价本次服务
                  </button>
                ) : null}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* 评价弹窗 */}
      {showReviewModal && reviewOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">评价跑手：{reviewOrder.runner.nickname}</h3>
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

      {/* 日志弹窗 */}
      {showLogsModal && logsOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">订单轨迹</h3>
                <p className="text-sm text-slate-400">{logsOrder.runner.nickname} - ¥{logsOrder.amount}</p>
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
