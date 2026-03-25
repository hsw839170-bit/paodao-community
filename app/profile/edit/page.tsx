'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RunnerProfile {
  id: string;
  nickname: string;
  avatar: string | null;
  phone: string;
  platform: string;
  bio: string | null;
  pricePer10M: number;
  status: 'ONLINE' | 'OFFLINE'; // 手动状态
  rating: number;
  ordersCount: number;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [formData, setFormData] = useState({
    nickname: '',
    avatar: '',
    phone: '',
    platform: 'BOTH',
    bio: '',
    pricePer10M: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

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
      setFormData({
        nickname: data.profile.nickname || '',
        avatar: data.profile.avatar || '',
        phone: data.profile.phone || '',
        platform: data.profile.platform || 'BOTH',
        bio: data.profile.bio || '',
        pricePer10M: data.profile.pricePer10M?.toString() || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/runners/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // 注意：不提交 status 字段，在线状态在个人中心单独切换
        body: JSON.stringify({
          nickname: formData.nickname,
          phone: formData.phone,
          platform: formData.platform,
          bio: formData.bio,
          pricePer10M: formData.pricePer10M,
          avatar: formData.avatar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新失败');
      }

      setSuccess('资料更新成功！');
      setProfile(data.profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg shadow-md p-8 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">编辑跑手资料</h1>
          <Link
            href="/profile"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            返回个人中心
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/30">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 text-green-400 p-3 rounded mb-4 text-sm border border-green-500/30">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                联系手机号 *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                头像 URL
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="https://..."
              />
              <p className="text-xs text-slate-500 mt-1">
                可选：输入图片链接，留空则使用默认头像
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              个人简介
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="介绍你的服务优势、游戏经验等"
            />
          </div>

          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">在线状态在哪里修改？</p>
                <p>在线/离线状态请在「个人中心」切换。当您有进行中的订单时，状态会自动显示为"忙碌中"。</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/profile"
              className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-md hover:bg-slate-600 text-center transition"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 disabled:opacity-50 transition"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
