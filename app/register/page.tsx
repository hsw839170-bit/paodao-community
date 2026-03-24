'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    platform: '端游',
    bio: ''
  })

  const platforms = ['端游', '手游', '两者都可']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/runners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage('✅ 入驻申请提交成功！审核通过后将显示在列表中。')
        setTimeout(() => router.push('/'), 2000)
      } else {
        const data = await response.json()
        setMessage(`❌ ${data.error || '提交失败，请重试'}`)
      }
    } catch (error) {
      setMessage('❌ 网络错误，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <h1 className="text-3xl font-bold text-center mb-2">跑手入驻</h1>
        <p className="text-slate-400 text-center mb-8">填写信息，加入 DeltaRun 社区</p>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-center ${
            message.includes('✅') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-8 space-y-6">
          {/* 姓名 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              姓名/昵称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="请输入名字"
            />
          </div>

          {/* 联系方式 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              联系方式 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="VX: xxx 或 QQ: xxx"
            />
            <p className="text-xs text-slate-500 mt-1">请填写微信或QQ，方便老板联系你</p>
          </div>

          {/* 平台选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              游戏平台 <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setFormData({...formData, platform})}
                  className={`px-4 py-2 rounded-lg transition ${
                    formData.platform === platform
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {formData.platform === platform ? '✓ ' : ''}{platform}
                </button>
              ))}
            </div>
          </div>

          {/* 个人简介 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              个人简介 <span className="text-slate-500">(选填)</span>
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="介绍你的跑刀经验、服务时间、优势等..."
              maxLength={200}
            />
            <p className="text-xs text-slate-500 mt-1 text-right">{formData.bio.length}/200</p>
          </div>

          {/* 实名认证提示 */}
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 text-xl">🛡️</span>
              <div>
                <h3 className="font-semibold text-yellow-200">实名认证</h3>
                <p className="text-sm text-yellow-200/80 mt-1">
                  入驻后将进行实名认证审核，认证通过后会显示"已认证"标识，提高可信度。
                </p>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg font-semibold text-lg transition"
          >
            {isSubmitting ? '提交中...' : '提交入驻申请'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            提交即表示同意<a href="/terms" className="text-blue-400">用户协议</a>
          </p>
        </form>
      </div>
    </main>
  )
}
