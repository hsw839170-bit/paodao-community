'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { 
  Clock, 
  Zap, 
  Gamepad2, 
  Loader2,
  AlertCircle,
  Filter,
  ChevronDown
} from 'lucide-react';
import { safeGetItem } from '@/lib/storage';

interface PublicOrder {
  id: string;
  amount: number;
  gameAmount: number | null;
  note: string | null;
  claimDeadline: string | null;
  createdAt: string;
  user: {
    id: string;
  };
}

interface Filters {
  platform: string;
  minPrice: string;
  maxPrice: string;
  sort: 'createdAt' | 'amount';
  order: 'asc' | 'desc';
}

export default function PublicOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    platform: '',
    minPrice: '',
    maxPrice: '',
    sort: 'createdAt',
    order: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = useCallback(async (cursor?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.platform) params.set('platform', filters.platform);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      params.set('sort', filters.sort);
      params.set('order', filters.order);
      params.set('limit', '20');
      if (cursor) params.set('cursor', cursor);

      const token = safeGetItem('token');
      const res = await fetch(`/api/orders/public?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('获取订单失败');
      }

      const data = await res.json();
      
      if (cursor) {
        setOrders(prev => [...prev, ...data.orders]);
      } else {
        setOrders(data.orders);
      }
      
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取订单失败');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const claimOrder = async (orderId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      router.push('/login');
      return;
    }

    try {
      setClaiming(orderId);
      
      const res = await fetch(`/api/orders/${orderId}/claim`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert('抢单成功！');
        router.push(`/profile/orders/${orderId}`);
      } else if (res.status === 409) {
        alert('订单已被抢走，刷新列表试试');
        fetchOrders();
      } else {
        alert(data.error || '抢单失败');
      }
    } catch (err) {
      alert('抢单失败，请稍后重试');
    } finally {
      setClaiming(null);
    }
  };

  const getTimeLeft = (deadline: string | null, _tick: number) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return '已过期';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}小时${minutes % 60}分`;
    }
    return `${minutes}分${seconds}秒`;
  };

  useEffect(() => {
    fetchOrders();

    // 设置轮询（30秒间隔）刷新订单列表
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Navbar />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">⚡ 抢单大厅</h1>
              <p className="text-slate-400">实时公开订单，手快有手慢无</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filters.platform}
                onChange={(e) => setFilters(f => ({ ...f, platform: e.target.value }))}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">全部平台</option>
                <option value="PC">端游</option>
                <option value="MOBILE">手游</option>
                <option value="BOTH">两者都可</option>
              </select>

              <input
                type="number"
                placeholder="最低价格"
                value={filters.minPrice}
                onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />

              <input
                type="number"
                placeholder="最高价格"
                value={filters.maxPrice}
                onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />

              <select
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setFilters(f => ({ ...f, sort: sort as any, order: order as any }));
                }}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="createdAt-desc">最新发布</option>
                <option value="createdAt-asc">最早发布</option>
                <option value="amount-desc">价格最高</option>
                <option value="amount-asc">价格最低</option>
              </select>
            </div>
          )}
        </div>

        <div>
          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-400">{error}</p>
              <button
                onClick={() => fetchOrders()}
                className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition"
              >
                重试
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 text-lg">暂无可抢订单</p>
              <p className="text-slate-500 text-sm mt-2">刷新看看或稍后再来</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const timeLeft = getTimeLeft(order.claimDeadline, tick);
                const isExpired = timeLeft === '已过期';
                
                return (
                  <div
                    key={order.id}
                    className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                              公开订单
                            </span>
                            {timeLeft && (
                              <span className={`flex items-center gap-1 text-xs ${
                                isExpired ? 'text-red-400' : 'text-orange-400'
                              }`}>
                                <Clock className="w-3.5 h-3.5" />
                                {isExpired ? '已过期' : `剩余 ${timeLeft}`}
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-3xl font-bold text-yellow-400">
                              ¥{order.amount}
                            </span>
                            <span className="text-slate-400 text-sm">/单</span>
                          </div>

                          {order.gameAmount && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-300 mb-2">
                              <Gamepad2 className="w-4 h-4 text-blue-400" />
                              {order.gameAmount}万 哈夫币
                            </div>
                          )}

                          {order.note && (
                            <p className="text-sm text-slate-400 line-clamp-2">{order.note}</p>
                          )}
                        </div>

                        <button
                          onClick={() => claimOrder(order.id)}
                          disabled={claiming === order.id || isExpired}
                          className={`shrink-0 px-6 py-3 rounded-xl font-medium transition ${
                            isExpired
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : claiming === order.id
                              ? 'bg-slate-700 text-slate-400'
                              : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 shadow-lg shadow-orange-500/30'
                          }`}
                        >
                          {claiming === order.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isExpired ? (
                            '已过期'
                          ) : (
                            '抢单'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => nextCursor && fetchOrders(nextCursor)}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      '加载更多'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
