'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  Coins, 
  Gamepad2, 
  Hand, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Filter,
  ChevronDown
} from 'lucide-react';

// Avatar fallback component
function Avatar({ name }: { name: string }) {
  const initial = name?.[0]?.toUpperCase() || '?';
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
      {initial}
    </div>
  );
}

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
  // 倒计时 tick，用于触发重新渲染
  const [tick, setTick] = useState(0);

  // 实时倒计时：每秒更新一次
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取公开订单列表
  const fetchOrders = async (cursor?: string) => {
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

      const token = localStorage.getItem('token');
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
  };

  // 抢单
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
        // 跳转到订单详情页
        router.push(`/profile/orders/${orderId}`);
      } else if (res.status === 409) {
        alert('订单已被抢走，刷新列表试试');
        fetchOrders(); // 刷新列表
      } else {
        alert(data.error || '抢单失败');
      }
    } catch (err) {
      alert('抢单失败，请稍后重试');
    } finally {
      setClaiming(null);
    }
  };

  // 格式化剩余时间（依赖 tick 实现实时更新）
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
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Hand className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">抢单大厅</h1>
                <p className="text-sm text-gray-500">手快有，手慢无</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filters.platform}
                onChange={(e) => setFilters(f => ({ ...f, platform: e.target.value }))}
                className="px-3 py-2 border rounded-lg text-sm"
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
                className="px-3 py-2 border rounded-lg text-sm"
              />

              <input
                type="number"
                placeholder="最高价格"
                value={filters.maxPrice}
                onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="px-3 py-2 border rounded-lg text-sm"
              />

              <select
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setFilters(f => ({ ...f, sort: sort as any, order: order as any }));
                }}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="createdAt-desc">最新发布</option>
                <option value="createdAt-asc">最早发布</option>
                <option value="amount-desc">价格最高</option>
                <option value="amount-asc">价格最低</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Order List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              重试
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hand className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无可抢订单</p>
            <p className="text-sm text-gray-400 mt-2">刷新看看或稍后再来</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const timeLeft = getTimeLeft(order.claimDeadline, tick);
              
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            公开订单
                          </span>
                          {timeLeft && (
                            <span className={`flex items-center gap-1 text-xs ${
                              timeLeft === '已过期' ? 'text-red-500' : 'text-orange-500'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {timeLeft === '已过期' ? '已过期' : `剩余 ${timeLeft}`}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-2xl font-bold text-yellow-600">
                            ¥{order.amount}
                          </span>
                          <span className="text-gray-400 text-sm">/单</span>
                        </div>

                        {order.gameAmount && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                            <Gamepad2 className="w-4 h-4" />
                            {order.gameAmount}万 哈夫币
                          </div>
                        )}

                        {order.note && (
                          <p className="text-sm text-gray-600 line-clamp-2">{order.note}</p>
                        )}
                      </div>

                      <button
                        onClick={() => claimOrder(order.id)}
                        disabled={claiming === order.id || timeLeft === '已过期'}
                        className={`ml-4 px-6 py-3 rounded-xl font-medium transition-colors ${
                          timeLeft === '已过期'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : claiming === order.id
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600 active:scale-95'
                        }`}
                      >
                        {claiming === order.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : timeLeft === '已过期' ? (
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

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => nextCursor && fetchOrders(nextCursor)}
                  disabled={loading}
                  className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
  );
}
