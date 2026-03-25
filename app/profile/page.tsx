'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RunnerProfile {
  id: string;
  nickname: string;
  avatar: string | null;
  phone: string;
  platform: string;
  bio: string | null;
  pricePer10M: number;
  manualStatus: 'ONLINE' | 'OFFLINE'; // 手动设置的状态
  computedStatus: 'ONLINE' | 'OFFLINE' | 'BUSY'; // 计算后的状态
  rating: number;
  ordersCount: number;
  createdAt: string;
}

interface User {
  id: string;
  phone: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(savedUser));
    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch('/api/runners/me', {
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
        throw new Error('获取资料失败');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      console.error('获取资料失败:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // 切换在线/离线状态
  const toggleStatus = async () => {
    if (!profile || togglingStatus) return;

    // BUSY 状态不能手动切换
    if (profile.computedStatus === 'BUSY') {
      alert('您有进行中的订单，无法切换状态。请先完成或取消订单。');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setTogglingStatus(true);

    // 新状态：当前是 ONLINE 则切为 OFFLINE，反之亦然
    const newStatus = profile.manualStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';

    try {
      const response = await fetch('/api/runners/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '切换状态失败');
      }

      // 刷新资料
      await fetchProfile(token);
    } catch (err: any) {
      console.error('切换状态失败:', err);
      alert(err.message || '切换状态失败');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getPlatformText = (platform: string) => {
    const map: Record<string, string> = {
      PC: '端游',
      MOBILE: '手游',
      BOTH: '两者都可',
    };
    return map[platform] || platform;
  };

  // 获取状态显示配置
  const getStatusConfig = (status: 'ONLINE' | 'OFFLINE' | 'BUSY') => {
    const configs = {
      ONLINE: { 
        text: '在线接单中', 
        className: 'bg-green-500',
        description: '您可以接收新订单'
      },
      OFFLINE: { 
        text: '离线', 
        className: 'bg-gray-500',
        description: '您暂时不会出现在列表中'
      },
      BUSY: { 
        text: '忙碌中', 
        className: 'bg-yellow-500',
        description: '您有进行中的订单，完成后自动恢复'
      },
    };
    return configs[status] || configs.OFFLINE;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        加载中...
      </div>
    );
  }

  // 未登录或无资料时重定向到登录页
  if (!user || !profile) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        跳转中...
      </div>
    );
  }

  const statusConfig = getStatusConfig(profile.computedStatus);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 导航栏 */}
        <nav className="flex justify-center gap-4 mb-8">
          <Link href="/" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            首页
          </Link>
          <Link href="/leaderboard" className="px-6 py-2.5 bg-slate-700/80 rounded-full text-white font-medium hover:bg-slate-600 transition">
            排行榜
          </Link>
          <Link href="/profile" className="px-6 py-2.5 bg-blue-600 rounded-full text-white font-medium">
            个人中心
          </Link>
          <Link href="/register" className="px-6 py-2.5 bg-green-600 rounded-full text-white font-medium hover:bg-green-500 transition">
            我要入驻
          </Link>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">个人中心</h1>
          <p className="text-slate-400">管理你的跑手资料</p>
        </div>

        {/* 跑手信息卡片 */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.nickname}
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold">
                  {profile.nickname.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{profile.nickname}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}>
                    {statusConfig.text}
                  </span>
                  <span className="text-slate-400 text-sm">{getPlatformText(profile.platform)}</span>
                </div>
                <div className="text-slate-400 text-sm mt-1">
                  登录手机: {user.phone}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/profile/edit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition text-sm"
              >
                编辑资料
              </Link>
              <Link
                href="/profile/orders"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition text-sm"
              >
                我的订单
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition text-sm"
              >
                退出登录
              </button>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-4 p-4 bg-slate-700/30 rounded-xl">
              <p className="text-slate-300">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* 状态控制卡片 - 简化版 */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4">在线状态</h3>
          
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-3 h-3 rounded-full ${statusConfig.className} ${profile.computedStatus !== 'OFFLINE' ? 'animate-pulse' : ''}`}></span>
                <span className="font-medium">{statusConfig.text}</span>
              </div>
              <p className="text-slate-400 text-sm">{statusConfig.description}</p>
            </div>
            
            {/* 状态切换按钮 - 始终显示，BUSY 时禁用 */}
            <button
              onClick={toggleStatus}
              disabled={togglingStatus || profile.computedStatus === 'BUSY'}
              className={`px-6 py-2.5 rounded-lg font-medium transition text-sm whitespace-nowrap ml-4 ${
                profile.computedStatus === 'BUSY'
                  ? 'bg-yellow-600/50 text-yellow-200 cursor-not-allowed'
                  : profile.manualStatus === 'ONLINE'
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              } disabled:opacity-70`}
            >
              {togglingStatus 
                ? '处理中...' 
                : profile.computedStatus === 'BUSY'
                  ? '忙碌中'
                  : profile.manualStatus === 'ONLINE' 
                    ? '我要下线' 
                    : '我要上线'
              }
            </button>
          </div>

          <div className="text-xs text-slate-500">
            <p>💡 提示：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>点击"我要上线"后，您的信息会出现在首页列表中</li>
              <li>点击"我要下线"后，您不会出现在首页列表中</li>
              <li>当您接单后，状态会自动变为"忙碌中"，完成后自动恢复</li>
            </ul>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">{profile.ordersCount}</div>
            <div className="text-sm text-slate-400">接单次数</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">¥{profile.pricePer10M}</div>
            <div className="text-sm text-slate-400">每1000万价格</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-1">{profile.rating.toFixed(1)}</div>
            <div className="text-sm text-slate-400">评分</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {new Date(profile.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-sm text-slate-400">入驻时间</div>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4">联系方式</h3>
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{profile.phone}</span>
            </div>
            <span className="text-xs text-slate-500">客户将通过此号码联系你</span>
          </div>
        </div>

        {/* 订单记录（演示） */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">接单记录</h2>
            <Link href="/profile/orders" className="text-blue-400 hover:text-blue-300 text-sm">
              查看全部 →
            </Link>
          </div>

          <div className="text-center py-8 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>暂无接单记录</p>
            <p className="text-sm mt-2">保持在线状态，等待老板下单</p>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-200">
              💡 提示：确保你的联系方式正确，并保持在线状态，这样老板才能找到你。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
