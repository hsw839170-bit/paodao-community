'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CreateOrderFormProps {
  runnerId?: string;
  runnerName?: string;
  runnerPrice?: number;
}

export default function CreateOrderForm({ 
  runnerId, 
  runnerName, 
  runnerPrice 
}: CreateOrderFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'PRIVATE' | 'PUBLIC'>(runnerId ? 'PRIVATE' : 'PUBLIC')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gameAmount: '',
    amount: '',
    claimDeadline: '',
    platform: 'BOTH',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)

  // 如果是指定跑手模式，自动计算金额
  useEffect(() => {
    if (mode === 'PRIVATE' && runnerPrice && formData.gameAmount) {
      const gameAmount = parseInt(formData.gameAmount) || 0
      const estimatedPrice = Math.ceil((gameAmount / 1000) * runnerPrice)
      setFormData(prev => ({ ...prev, amount: estimatedPrice.toString() }))
    }
  }, [mode, runnerPrice, formData.gameAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // 基础验证
      if (!formData.title.trim()) {
        throw new Error('请输入订单标题')
      }

      if (!formData.amount || parseInt(formData.amount) < 1) {
        throw new Error('请输入有效的订单金额')
      }

      let response;

      if (mode === 'PRIVATE' && runnerId) {
        // 指定跑手下单
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            runnerId,
            amount: parseInt(formData.amount),
            gameAmount: formData.gameAmount ? parseInt(formData.gameAmount) : null,
            note: formData.description,
          }),
        })
      } else {
        // 发布到抢单大厅
        response = await fetch('/api/orders/public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            amount: parseInt(formData.amount),
            gameAmount: formData.gameAmount ? parseInt(formData.gameAmount) : null,
            claimDeadline: formData.claimDeadline || null,
            platform: formData.platform,
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建订单失败')
      }

      setCreatedOrder(data.order)
      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '创建订单失败'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success && createdOrder) {
    return (
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">
          {mode === 'PRIVATE' ? '订单提交成功！' : '订单已发布到抢单大厅！'}
        </h2>
        <p className="text-slate-400 mb-6">
          {mode === 'PRIVATE' 
            ? '跑手接单后，您可以在订单详情中查看联系方式' 
            : '跑手抢单后，您将收到通知并可以查看联系方式'}
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/my-orders"
            className="px-6 py-3 bg-blue-600 rounded-xl font-medium hover:bg-blue-500 transition"
          >
            查看我的订单
          </Link>
          {mode === 'PUBLIC' && (
            <Link 
              href="/public-orders"
              className="px-6 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition"
            >
              去抢单大厅看看
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 模式选择 */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          选择下单方式
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('PRIVATE')}
            disabled={!runnerId}
            className={`p-4 rounded-xl border-2 text-left transition ${
              mode === 'PRIVATE'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500'
            } ${!runnerId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-medium mb-1">指定跑手</div>
            <div className="text-xs text-slate-400">
              {runnerId ? `向 ${runnerName} 下单` : '请先选择跑手'}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('PUBLIC')}
            className={`p-4 rounded-xl border-2 text-left transition ${
              mode === 'PUBLIC'
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <div className="font-medium mb-1 flex items-center gap-2">
              <span>发布到抢单大厅</span>
              <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">NEW</span>
            </div>
            <div className="text-xs text-slate-400">
              让多个跑手竞价接单
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 订单标题（PUBLIC 模式必填） */}
      {mode === 'PUBLIC' && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            订单标题 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="例如：需要 5000万 哈夫币，越快越好"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            maxLength={100}
          />
          <div className="text-xs text-slate-500 mt-1">{formData.title.length}/100</div>
        </div>
      )}

      {/* 游戏币数量 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          需要哈夫币数量（万）
        </label>
        <input
          type="number"
          min="1"
          max="1000000"
          value={formData.gameAmount}
          onChange={(e) => setFormData({ ...formData, gameAmount: e.target.value })}
          placeholder="例如：5000"
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
        />
      </div>

      {/* 金额 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          支付金额（元）{mode === 'PRIVATE' && runnerPrice && (
            <span className="text-slate-500 text-xs">（自动计算）</span>
          )}
        </label>
        <input
          type="number"
          min="1"
          max="100000"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="例如：50"
          disabled={mode === 'PRIVATE' && !!runnerPrice}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 disabled:opacity-50"
        />
        {mode === 'PUBLIC' && (
          <div className="text-xs text-slate-500 mt-1">
            建议参考市场价：10-20 元/1000万
          </div>
        )}
      </div>

      {/* 平台要求（PUBLIC 模式） */}
      {mode === 'PUBLIC' && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            平台要求
          </label>
          <select
            value={formData.platform}
            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="BOTH">不限（端游/手游均可）</option>
            <option value="PC">端游</option>
            <option value="MOBILE">手游</option>
          </select>
          <div className="text-xs text-yellow-500/70 mt-1">
            注意：当前 PUBLIC 订单暂不支持按平台筛选，此信息仅供参考
          </div>
        </div>
      )}

      {/* 抢单截止时间（PUBLIC 模式） */}
      {mode === 'PUBLIC' && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            抢单截止时间
          </label>
          <select
            value={formData.claimDeadline}
            onChange={(e) => {
              const hours = parseInt(e.target.value)
              const deadline = hours 
                ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
                : ''
              setFormData({ ...formData, claimDeadline: deadline })
            }}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="">24 小时（默认）</option>
            <option value={12}>12 小时</option>
            <option value={6}>6 小时</option>
            <option value={48}>48 小时</option>
            <option value={72}>72 小时</option>
          </select>
        </div>
      )}

      {/* 描述 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          订单备注（可选）
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={mode === 'PUBLIC' ? '补充说明你的需求，例如：时间要求、特殊要求等' : '如有特殊要求请在此说明'}
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 resize-none"
        />
        <div className="text-xs text-slate-500 mt-1">{formData.description.length}/500</div>
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={submitting || (mode === 'PRIVATE' && !runnerId)}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition ${
          mode === 'PUBLIC'
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0  0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            提交中...
          </span>
        ) : mode === 'PUBLIC' ? (
          '发布到抢单大厅'
        ) : (
          '提交订单'
        )}
      </button>
    </form>
  )
}
