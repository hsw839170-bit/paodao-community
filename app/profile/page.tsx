'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

interface RunnerProfile {
  id: string;
  nickname: string;
  avatar: string | null;
  phone: string;
  platform: string;
  bio: string | null;
  pricePer10M: number;
  manualStatus: 'ONLINE' | 'OFFLINE';
  computedStatus: 'ONLINE' | 'OFFLINE' | 'BUSY';
  rating: number;
  ordersCount: number;
  createdAt: string;
}

interface UserInfo {
  id: string;
  phone: string;
  role: string;
  activeRole: 'BOSS' | 'RUNNER';
  hasRunnerProfile: boolean;
  isBoss: boolean;
  canSwitch: boolean;
  profile: RunnerProfile | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  // 本地乐观状态，用于 UI 即时反馈
  const [optimisticStatus, setOptimisticStatus] = useState<'ONLINE' | 'OFFLINE' | 'BUSY' | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserInfo(token);
  }, [router]);

  // 获取用户信息（包含激活的角色）
  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        throw new Error('获取用户信息失败');
      }

      const data = await response.json();
      setUser(data.user);
      
      // 更新 localStorage 中的用户信息
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      console.error('获取用户信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 切换身份
  const switchRole = async (targetRole: 'BOSS' | 'RUNNER') => {
    if (!user || switchingRole || user.activeRole === targetRole) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setSwitchingRole(true);
    try {
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'NO_RUNNER_PROFILE') {
          // 没有跑手资料，跳转入驻页面
          router.push('/register?role=RUNNER');
          return;
        }
        throw new Error(data.error || '切换身份失败');
      }

      // 更新 token 和用户信息
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 刷新页面以应用新身份
      window.location.reload();
    } catch (err: any) {
      console.error('切换身份失败:', err);
      alert(err.message || '切换身份失败');
    } finally {
      setSwitchingRole(false);
    }
  };

  // 切换在线/离线状态（仅跑手）
  const toggleStatus = async () => {
    if (!user?.profile || togglingStatus) return;

    const profile = user.profile;
    if (profile.computedStatus === 'BUSY') {
      alert('您有进行中的订单，无法切换状态。请先完成或取消订单。');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const newStatus = profile.manualStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    
    // 乐观更新：立即更新本地状态，提供即时反馈
    setOptimisticStatus(newStatus);
    setTogglingStatus(true);

    try {
      const response = await fetch('/api/runners/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        // 失败时恢复原始状态
        setOptimisticStatus(null);
        throw new Error(data.error || '切换状态失败');
      }

      // 成功：刷新用户信息，同步后端状态
      await fetchUserInfo(token);
    } catch (err: any) {
      console.error('切换状态失败:', err);
      alert(err.message || '切换状态失败');
    } finally {
      setTogglingStatus(false);
      setOptimisticStatus(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getPlatformText = (platform: string) => {
    const map: Record<string, string> = { PC: '端游', MOBILE: '手游', BOTH: '两者都可' };
    return map[platform] || platform;
  };

  // 获取当前显示的状态（优先使用乐观更新状态）
  const getCurrentStatus = (): 'ONLINE' | 'OFFLINE' | 'BUSY' => {
    if (optimisticStatus) return optimisticStatus;
    return profile?.computedStatus || 'OFFLINE';
  };

  // 获取当前 manualStatus（用于按钮显示）
  const getCurrentManualStatus = (): 'ONLINE' | 'OFFLINE' => {
    if (optimisticStatus === 'ONLINE' || optimisticStatus === 'OFFLINE') return optimisticStatus;
    return profile?.manualStatus || 'OFFLINE';
  };

  const getStatusConfig = (status: 'ONLINE' | 'OFFLINE' | 'BUSY') => {
    const configs = {
      ONLINE: { text: '在线接单中', className: 'bg-green-500', description: '您可以接收新订单' },
      OFFLINE: { text: '离线', className: 'bg-gray-500', description: '您暂时不会出现在列表中' },
      BUSY: { text: '忙碌中', className: 'bg-yellow-500', description: '您有进行中的订单，完成后自动恢复' },
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        跳转中...
      </div>
    );
  }

  const isRunnerMode = user.activeRole === 'RUNNER';
  const profile = user.profile;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 导航栏 */}
        <Navbar isRunnerMode={isRunnerMode} />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isRunnerMode ? '跑手中心' : '老板中心'}
          </h1>
          <p className="text-slate-400">
            {isRunnerMode ? '管理你的跑手资料' : '管理你的订单'}
          </p>
        </div>

        {/* 身份切换卡片 */}
        {user.canSwitch && (
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur border border-blue-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold mb-1">身份切换</h3>
                <p className="text-sm text-slate-400">
                  您同时拥有老板和跑手身份，可以快速切换
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => switchRole('BOSS')}
                  disabled={switchingRole || !isRunnerMode}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                    !isRunnerMode
                      ? 'bg-yellow-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  } disabled:opacity-50`}
                >
                  {!isRunnerMode ? '✓ 老板身份' : '切换到老板'}
                </button>
                <button
                  onClick={() => switchRole('RUNNER')}
                  disabled={switchingRole || isRunnerMode}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                    isRunnerMode
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  } disabled:opacity-50`}
                >
                  {isRunnerMode ? '✓ 跑手身份' : '切换到跑手'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 跑手模式内容 */}
        {isRunnerMode && profile && (
          <>
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
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(getCurrentStatus()).className}`}>
                        {getStatusConfig(getCurrentStatus()).text}
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

            {/* 状态控制卡片 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
              <h3 className="font-bold mb-4">在线状态</h3>
              
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${getStatusConfig(getCurrentStatus()).className} ${getCurrentStatus() !== 'OFFLINE' ? 'animate-pulse' : ''}`}></span>
                    <span className="font-medium">{getStatusConfig(getCurrentStatus()).text}</span>
                    {optimisticStatus && <span className="text-xs text-slate-400">(更新中...)</span>}
                  </div>
                  <p className="text-slate-400 text-sm">{getStatusConfig(getCurrentStatus()).description}</p>
                </div>
                
                <button
                  onClick={toggleStatus}
                  disabled={togglingStatus || getCurrentStatus() === 'BUSY'}
                  className={`px-6 py-2.5 rounded-lg font-medium transition text-sm whitespace-nowrap ml-4 ${
                    getCurrentStatus() === 'BUSY'
                      ? 'bg-yellow-600/50 text-yellow-200 cursor-not-allowed'
                      : getCurrentManualStatus() === 'ONLINE'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  } disabled:opacity-70`}
                >
                  {togglingStatus 
                    ? '处理中...' 
                    : getCurrentStatus() === 'BUSY'
                      ? '忙碌中'
                      : getCurrentManualStatus() === 'ONLINE' 
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

            {/* 接单记录 */}
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
            </div>
          </>
        )}

        {/* 老板模式内容 */}
        {!isRunnerMode && (
          <>
            {/* 老板信息卡片 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-yellow-600 flex items-center justify-center text-3xl font-bold">
                    板
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">老板身份</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-600">
                        BOSS
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm mt-1">
                      登录手机: {user.phone}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition text-sm"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>

            {/* 老板功能卡片 */}
            <div className="grid gap-4 mb-6">
              <Link href="/" className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold">查找跑手</h3>
                    <p className="text-sm text-slate-400">浏览在线跑手列表，寻找合适的跑手</p>
                  </div>
                </div>
              </Link>

              <Link href="/my-orders" className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-purple-500/50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold">我的订单</h3>
                    <p className="text-sm text-slate-400">查看你下单的所有订单状态</p>
                  </div>
                </div>
              </Link>

              {!user.hasRunnerProfile && (
                <Link href="/register?role=RUNNER" className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-green-500/50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">入驻成为跑手</h3>
                      <p className="text-sm text-slate-400">添加跑手身份，可以同时接单赚钱</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* 订单记录 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">我的订单</h2>
                <Link href="/my-orders" className="text-blue-400 hover:text-blue-300 text-sm">
                  查看全部 →
                </Link>
              </div>

              <div className="text-center py-8 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>暂无订单</p>
                <p className="text-sm mt-2">去首页找跑手下单吧</p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
