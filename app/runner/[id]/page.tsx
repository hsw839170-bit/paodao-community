'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Runner {
  id: string;
  nickname: string;
  avatar: string | null;
  phone: string;
  platform: string;
  bio: string | null;
  pricePer10M: number;
  status: string;
  rating: number;
  ordersCount: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    phone: string;
  };
  order: {
    amount: number;
  };
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: { star: number; count: number }[];
}

interface PageProps {
  params: { id: string };
}

export default function RunnerDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [runner, setRunner] = useState<Runner | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 下单弹窗状态
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    amount: '',
    gameAmount: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetchRunner();
    fetchReviews();
  }, [params.id]);

  const fetchRunner = async () => {
    try {
      const response = await fetch(`/api/runners/${params.id}/`);
      if (!response.ok) {
        throw new Error('跑手不存在');
      }
      const data = await response.json();
      setRunner(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/runners/${params.id}/reviews/`);
      if (!response.ok) return;
      const data = await response.json();
      setReviews(data.reviews);
      setReviewStats(data.stats);
    } catch (err) {
      console.error('获取评价失败:', err);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      router.push('/login');
      return;
    }

    if (!orderForm.amount) {
      alert('请输入订单金额');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          runnerId: params.id,
          amount: parseInt(orderForm.amount),
          gameAmount: orderForm.gameAmount ? parseInt(orderForm.gameAmount) : undefined,
          note: orderForm.note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '下单失败');
      }

      setOrderSuccess(true);
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderSuccess(false);
        setOrderForm({ amount: '', gameAmount: '', note: '' });
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染星级
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-slate-600'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div>加载中...</div>
      </main>
    );
  }

  if (error || !runner) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '跑手不存在'}</p>
          <Link href="/" className="text-blue-400 hover:underline">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  // 状态显示
  const statusConfig: Record<string, { text: string; color: string; bgColor: string; textColor: string }> = {
    ONLINE: { text: '在线', color: 'bg-green-500', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
    OFFLINE: { text: '离线', color: 'bg-slate-500', bgColor: 'bg-slate-500/20', textColor: 'text-slate-400' },
    BUSY: { text: '接单中', color: 'bg-yellow-500', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' }
  };
  const status = statusConfig[runner.status] || statusConfig.OFFLINE;

  // 平台颜色
  const platformColors: Record<string, string> = {
    'PC': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'MOBILE': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'BOTH': 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-pink-300 border-pink-500/30'
  };
  const platformMap: Record<string, string> = {
    'PC': '端游',
    'MOBILE': '手游',
    'BOTH': '两者都可'
  };
  const platformColor = platformColors[runner.platform] || platformColors['PC'];
  const platformText = platformMap[runner.platform] || '端游';

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 导航栏 */}
        <nav className="flex justify-center gap-4 mb-6">
          <Link href="/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition">首页</Link>
          <Link href="/leaderboard/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition">排行榜</Link>
          <Link href="/profile/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition">个人中心</Link>
          <Link href="/register/" className="px-4 py-2 bg-blue-600 rounded-lg text-white">我要入驻</Link>
        </nav>

        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-block">
          ← 返回首页
        </Link>

        {/* 跑手信息卡片 */}
        <div className="bg-slate-800 rounded-2xl p-8 mb-6 border border-slate-700">
          <div className="flex items-start gap-6">
            {/* 头像 */}
            <div className="relative">
              {runner.avatar ? (
                <img src={runner.avatar} alt={runner.nickname} className="w-24 h-24 rounded-2xl object-cover" />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl font-bold">
                  {runner.nickname[0]}
                </div>
              )}
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${status.color} rounded-full flex items-center justify-center border-4 border-slate-800`}>
                <span className="text-xs">{runner.status === 'ONLINE' ? '●' : runner.status === 'BUSY' ? '◐' : '○'}</span>
              </div>
            </div>

            {/* 信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{runner.nickname}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${status.bgColor} ${status.textColor} border`}>
                  {status.text}
                </span>
              </div>
              
              <span className={`inline-block px-3 py-1 rounded-lg text-sm border mb-4 ${platformColor}`}>
                {platformText}
              </span>
              
              {runner.bio && (
                <p className="text-slate-300 mb-4">{runner.bio}</p>
              )}

              {/* 定价 */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">1000W哈夫币</span>
                  <span className="text-2xl font-bold text-green-400">= ¥{runner.pricePer10M}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">不足1000W按比例计算</p>
              </div>
            </div>

            {/* 评分 */}
            <div className="text-right">
              <div className="text-5xl font-bold text-yellow-400">★ {runner.rating.toFixed(1)}</div>
              <div className="text-slate-400 mt-1">用户评分</div>
              <div className="text-slate-500 text-sm mt-2">{runner.ordersCount} 单已完成</div>
              {reviewStats && (
                <div className="text-slate-500 text-sm">{reviewStats.total} 条评价</div>
              )}
            </div>
          </div>
        </div>

        {/* 下单按钮 */}
        {runner.status === 'ONLINE' ? (
          <button 
            onClick={() => setShowOrderModal(true)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-xl shadow-blue-600/30 transition hover:shadow-2xl hover:scale-[1.02]"
          >
            立即下单
          </button>
        ) : (
          <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
            <p className="text-slate-400 mb-2">该跑手当前{status.text}，暂无法接单</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              看看其他跑手 →
            </Link>
          </div>
        )}

        {/* 评价列表 */}
        {reviews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">用户评价</h2>
            
            {/* 评分分布 */}
            {reviewStats && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-yellow-400">{reviewStats.average.toFixed(1)}</div>
                    <div className="flex justify-center mt-2">{renderStars(Math.round(reviewStats.average))}</div>
                    <div className="text-slate-400 text-sm mt-1">{reviewStats.total} 条评价</div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {reviewStats.distribution.map((item) => (
                      <div key={item.star} className="flex items-center gap-3">
                        <span className="text-sm text-slate-400 w-8">{item.star}星</span>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{
                              width: reviewStats.total > 0 ? `${(item.count / reviewStats.total) * 100}%` : '0%'
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-400 w-10 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 评价列表 */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <span className="text-yellow-400 font-bold">{review.rating}.0</span>
                    </div>
                    <span className="text-slate-500 text-sm">
                      {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-slate-300 mb-3">"{review.comment}"</p>
                  )}
                  
                  <div className="text-slate-500 text-sm">
                    订单金额：¥{review.order.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提示 */}
        <div className="mt-6 bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4">
          <p className="text-yellow-200 text-sm">
            ⚠️ 风险提示：平台仅提供信息展示，交易风险由双方自行承担。建议先小额测试，确认靠谱后再长期合作。
          </p>
        </div>
      </div>

      {/* 下单弹窗 */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            {orderSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-400 mb-2">下单成功！</h3>
                <p className="text-slate-400">跑手将尽快联系您</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">向 {runner.nickname} 下单</h3>
                  <button 
                    onClick={() => setShowOrderModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      订单金额（元）*
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={orderForm.amount}
                      onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例如：50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      游戏币数量（万）
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={orderForm.gameAmount}
                      onChange={(e) => setOrderForm({ ...orderForm, gameAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例如：1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      备注
                    </label>
                    <textarea
                      rows={3}
                      value={orderForm.note}
                      onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="特殊要求或说明..."
                    />
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-400">
                    <p>跑手价格：¥{runner.pricePer10M}/1000万</p>
                    <p>您的联系方式将提供给跑手</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold disabled:opacity-50"
                  >
                    {submitting ? '提交中...' : '确认下单'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
