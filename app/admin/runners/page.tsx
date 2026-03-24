'use client';

import { useState, useEffect } from 'react';
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
  createdAt: string;
  user: {
    id: string;
    phone: string;
    role: string;
    createdAt: string;
  };
}

export default function AdminRunnersPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRunners();
  }, []);

  const fetchRunners = async () => {
    try {
      const response = await fetch('/api/admin/runners');

      if (!response.ok) {
        throw new Error('获取跑手列表失败');
      }

      const data = await response.json();
      setRunners(data.runners);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformText = (platform: string) => {
    const map: Record<string, string> = {
      PC: '端游',
      MOBILE: '手游',
      BOTH: '两者都可',
    };
    return map[platform] || platform;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      ONLINE: { text: '在线', className: 'bg-green-100 text-green-800' },
      BUSY: { text: '忙碌', className: 'bg-yellow-100 text-yellow-800' },
      OFFLINE: { text: '离线', className: 'bg-gray-100 text-gray-800' },
    };
    const config = map[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">跑手管理</h1>
            <p className="text-gray-600 mt-1">共 {runners.length} 位跑手</p>
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:underline text-sm"
          >
            返回首页
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">跑手</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">平台</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">价格</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">评分</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">订单</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">注册时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">联系方式</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {runners.map((runner) => (
                  <tr key={runner.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {runner.avatar ? (
                          <img
                            src={runner.avatar}
                            alt={runner.nickname}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {runner.nickname.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{runner.nickname}</div>
                          {runner.bio && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {runner.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm">{getPlatformText(runner.platform)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium">
                        {runner.pricePer10M}元/1000万
                      </span>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(runner.status)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm">{runner.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm">{runner.ordersCount}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(runner.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-mono">{runner.phone}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {runners.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无跑手数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
