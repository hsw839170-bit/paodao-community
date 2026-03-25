'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculatePrice } from '@/data/runners'

interface Runner {
  id: string
  name: string
  contact: string
  platform: string
  rating: string  // 格式如 "4.8分"
  orders: number
  status: string  // 'online' | 'offline'
  pricePer10M: number
  verified: boolean
  avatar?: string
  bio?: string
}

export default function OrderForm({ runner }: { runner: Runner }) {
  const router = useRouter()
  const [harvardCoins, setHarvardCoins] = useState('')
  const [platform, setPlatform] = useState('端游')
  const [notes, setNotes] = useState('')
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdOrder, setCreatedOrder] = useState<any>(null)

  const estimatedPrice = harvardCoins ? calculatePrice(Number(harvardCoins), runner.pricePer10M) : 0

  // 只有 ONLINE 状态可以下单
  const canOrder = runner.status === 'online'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canOrder || !harvardCoins) return

    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          runnerId: runner.id,
          amount: estimatedPrice,
          gameAmount: Number(harvardCoins),
          note: notes,
          platform: platform,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建订单失败')
      }

      setCreatedOrder(data.order)
      setOrderSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (orderSubmitted && createdOrder) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">订单已提交！</h2>
        <p className="text-slate-400 mb-6">请添加跑手联系方式，说明来自 DeltaRun</p>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
          <div className="text-sm text-slate-400 mb-2">跑手联系方式</div>
          <div className="text-2xl font-mono font-bold text-white">{runner.contact}</div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/my-orders">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-medium transition">
              查看我的订单
            </button>
          </Link>
          <Link href="/">
            <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-full font-medium transition">
              返回首页
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-3">游戏平台</label>
        <div className="flex gap-3">
          {['端游', '手游'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              disabled={!canOrder}
              className={`flex-1 py-3 rounded-xl border transition ${
                platform === p
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
              } disabled:opacity-50`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">需要跑多少哈夫币？</label>
        <div className="relative">
          <input
            type="number"
            value={harvardCoins}
            onChange={(e) => setHarvardCoins(e.target.value)}
            placeholder="输入数量（万）"
            min="100"
            required
            disabled={!canOrder}
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl focus:border-blue-500 focus:outline-none text-lg disabled:opacity-50"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">万</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">如：1000 表示 1000万哈夫币</p>
      </div>

      {estimatedPrice > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">预估价格</span>
            <span className="text-2xl font-bold text-green-400">¥{estimatedPrice}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">实际价格与跑手协商，此价格仅供参考</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-3">其他备注（可选）</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="如：指定时间段、地图偏好等"
          rows={3}
          disabled={!canOrder}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:border-blue-500 focus:outline-none resize-none disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={!canOrder || !harvardCoins || submitting}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-xl shadow-blue-600/30 transition hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting 
          ? '提交中...' 
          : runner.status === 'offline'
            ? '跑手离线中'
            : '提交订单 - 查看联系方式'
        }
      </button>

      {!canOrder && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-yellow-200">
              该跑手当前处于离线状态，无法接单。请选择其他在线跑手。
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
