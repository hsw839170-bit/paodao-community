'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeGetItem } from '@/lib/storage';

interface User {
  id: string;
  phone: string;
  nickname?: string;
  role?: string;
}

interface Order {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  amount: number;
  gameAmount: number | null;
  createdAt: string;
  runner?: {
    id: string;
    nickname: string;
  } | null;
}

export default function BossCenterPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = safeGetItem('token');
    const userStr = safeGetItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      fetchRecentOrders(token);
    } catch (error) {
      console.error('读取登录状态失败:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchRecentOrders = async (token: string) => {
    try {
      const response = await fetch('/api/orders?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.orders?.slice(0, 5) || []);
      }
    } catch (err) {
      console.error('获取最近订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { text: string; className: string }> = {
      PENDING: { text: '待接单', className: 'bg-yellow-500/20 text-yellow-400' },
      ACCEPTED: { text: '已接单', className: 'bg-blue-500/20 text-blue-400' },
      IN_PROGRESS: { text: '进行中', className: 'bg-purple-500/20 text-purple-400' },
      COMPLETED: { text: '已完成', className: 'bg-green-500/20 text-green-400' },
      CANCELED: { text: '已取消', className: 'bg-slate-500/20 text-slate-400' },
    };
    const c = config[status] || config.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.className}`}>
        {c.text}
      </span>
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
          <Link href="/public-orders" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            抢单大厅
          </Link>
          <Link href="/boss" className="px-6 py-2.5 bg-purple-600 rounded-full text-white font-medium">
            老板中心
          </Link>
        </nav>

        {/* 老板身份信息 */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
              {user?.nickname?.[0] || '板'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {user?.nickname || '老板'}
                </h1>
                <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full">
                  老板
                </span>
              </div>
              <p className="text-slate-400">
                {user?.phone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')}
              </p>
            </div>
          </div>
        </div>

        {/* 主要操作入口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* 我的订单入口 */}
          <Link
            href="/my-orders"
            className="group bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-2xl p-6 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">
                📋
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold group-hover:text-blue-400 transition">
                  我的订单
                </h3>
                <p className="text-slate-400 text-sm">
                  查看全部订单状态、进度和评价
                </p>
              </div>
              <svg className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* 发布到抢单大厅入口 */}
          <Link
            href="/create-order?mode=PUBLIC"
            className="group bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 hover:border-yellow-400/50 rounded-2xl p-6 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-2xl">
                🚀
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-400">
                  发布订单到抢单大厅
                </h3>
                <p className="text-slate-400 text-sm">
                  公开发布，让跑手来抢单
                </p>
              </div>
              <svg className="w-6 h-6 text-yellow-500 group-hover:text-yellow-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* 最近订单 */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">最近订单</h2>
            <Link href="/my-orders" className="text-sm text-blue-400 hover:text-blue-300">
              查看全部 →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 mb-4">还没有订单</p>
              <Link
                href="/create-order?mode=PUBLIC"
                className="inline-block px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
              >
                去发布订单
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/my-orders/${order.id}`}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-sm">
                      {order.runner?.nickname?.[0] || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {order.runner?.nickname || '待分配'}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      ¥{order.amount}
                    </div>
                    {order.gameAmount && (
                      <div className="text-xs text-slate-400">
                        {order.gameAmount}万游戏币
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
