'use client';

import { safeGetItem, safeSetItem, safeRemoveItem } from '@/lib/storage';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 角色绑定响应类型
interface BindData {
  success: boolean;
  code: string;
  message: string;
  existingRoles: {
    isBoss: boolean;
    isRunner: boolean;
  };
  requestedRole: string;
  user: {
    id: string;
    phone: string;
    role: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'RUNNER', // RUNNER | BOSS
    // 跑手专属字段
    nickname: '',
    avatar: '',
    contactPhone: '',
    platform: 'BOTH',
    bio: '',
    pricePer10M: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  // 角色绑定相关状态
  const [showBindDialog, setShowBindDialog] = useState(false);
  const [bindData, setBindData] = useState<BindData | null>(null);
  const [bindLoading, setBindLoading] = useState(false);

  const isRunner = formData.role === 'RUNNER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 构造请求体
      const requestBody: Record<string, string> = {
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      };

      // 跑手需要额外字段
      if (isRunner) {
        requestBody.nickname = formData.nickname;
        requestBody.contactPhone = formData.contactPhone;
        requestBody.platform = formData.platform;
        requestBody.pricePer10M = formData.pricePer10M;
        requestBody.avatar = formData.avatar;
        requestBody.bio = formData.bio;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // 处理角色绑定需求
      if (data.code === 'ROLE_BIND_REQUIRED') {
        setBindData(data);
        setShowBindDialog(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || '注册失败');
      }

      // 保存 token
      safeSetItem('token', data.token);
      safeSetItem('user', JSON.stringify(data.user));

      // 根据角色跳转
      if (isRunner) {
        router.push('/profile');
      } else {
        router.push('/'); // 老板跳转到首页找跑手
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败，请重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 处理角色绑定
  const handleBindRole = async () => {
    if (!bindData) return;
    
    setBindLoading(true);
    setError('');

    try {
      // 1. 先登录获取 token
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.error || '登录失败');
      }

      const token = loginData.token;

      // 2. 绑定新角色
      const bindRequestBody: any = {
        role: formData.role,
      };

      if (isRunner) {
        bindRequestBody.nickname = formData.nickname;
        bindRequestBody.contactPhone = formData.contactPhone;
        bindRequestBody.platform = formData.platform;
        bindRequestBody.pricePer10M = formData.pricePer10M;
        bindRequestBody.avatar = formData.avatar;
        bindRequestBody.bio = formData.bio;
      }

      const bindResponse = await fetch('/api/auth/bind-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bindRequestBody),
      });

      const bindData = await bindResponse.json();

      if (!bindResponse.ok) {
        throw new Error(bindData.error || '绑定角色失败');
      }

      // 3. 保存 token 并跳转
      safeSetItem('token', token);
      safeSetItem('user', JSON.stringify(loginData.user));

      if (isRunner) {
        router.push('/profile');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '绑定失败，请重试';
      setError(message);
    } finally {
      setBindLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.phone || !formData.password || !formData.confirmPassword) {
        setError('请填写所有必填项');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-md mx-auto bg-slate-800 rounded-lg shadow-md p-8 border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-2 text-white">
          {isRunner ? '跑手入驻' : '老板注册'}
        </h1>
        <p className="text-center text-slate-400 mb-6">
          步骤 {step} / {isRunner ? 2 : 1}
        </p>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              {/* 角色选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  注册身份 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'BOSS' })}
                    className={`py-3 px-4 rounded-lg border transition text-center ${
                      formData.role === 'BOSS'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-lg mb-1">👔</div>
                    <div className="font-medium">我是老板</div>
                    <div className="text-xs opacity-75">我要下单找跑手</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'RUNNER' })}
                    className={`py-3 px-4 rounded-lg border transition text-center ${
                      formData.role === 'RUNNER'
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-lg mb-1">🏃</div>
                    <div className="font-medium">我是跑手</div>
                    <div className="text-xs opacity-75">我要接单赚钱</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  登录手机号 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="用于登录的手机号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  密码 *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="设置登录密码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  确认密码 *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="再次输入密码"
                />
              </div>

              {isRunner ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  下一步
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '注册中...' : '立即注册'}
                </button>
              )}
            </>
          )}

          {step === 2 && isRunner && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  昵称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="跑手昵称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  联系手机号 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="客户联系你的手机号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  服务平台 *
                </label>
                <select
                  required
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="PC">端游</option>
                  <option value="MOBILE">手游</option>
                  <option value="BOTH">两者都可</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  价格（元/1000万哈夫币）*
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.pricePer10M}
                  onChange={(e) => setFormData({ ...formData, pricePer10M: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="例如：15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  头像 URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="头像图片链接（可选）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  个人简介
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="简单介绍你的服务优势（可选）"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-slate-700 text-slate-300 py-2 px-4 rounded-md hover:bg-slate-600"
                >
                  上一步
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '提交中...' : '提交入驻'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          已有账号？{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            立即登录
          </Link>
        </div>
      </div>

      {/* 角色绑定对话框 */}
      {showBindDialog && bindData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-xl font-bold mb-4">账号已存在</h3>
            <p className="text-slate-300 mb-4">
              手机号 {bindData.user.phone} 已注册，当前角色：
            </p>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">老板：</span>
                <span className={bindData.existingRoles.isBoss ? 'text-green-400' : 'text-slate-500'}>
                  {bindData.existingRoles.isBoss ? '✓ 已绑定' : '未绑定'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">跑手：</span>
                <span className={bindData.existingRoles.isRunner ? 'text-green-400' : 'text-slate-500'}>
                  {bindData.existingRoles.isRunner ? '✓ 已绑定' : '未绑定'}
                </span>
              </div>
            </div>
            <p className="text-slate-300 mb-4">
              是否绑定新的 <strong className="text-white">{isRunner ? '跑手' : '老板'}</strong> 身份？
            </p>
            {error && (
              <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBindDialog(false);
                  setBindData(null);
                }}
                className="flex-1 bg-slate-700 text-slate-300 py-2 px-4 rounded-lg hover:bg-slate-600"
              >
                取消
              </button>
              <button
                onClick={handleBindRole}
                disabled={bindLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {bindLoading ? '绑定中...' : '确认绑定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
