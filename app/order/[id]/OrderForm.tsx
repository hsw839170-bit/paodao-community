'use client'

import { useState } from 'react'
import Link from 'next/link'
import { calculatePrice } from '@/data/runners'

interface Runner {
  id: string
  name: string
  contact: string
  platform: string
  rating: number
  orders: number
  status: string
  pricePer10M: number
  verified: boolean
}

export default function OrderForm({ runner }: { runner: Runner }) {
  const [harvardCoins, setHarvardCoins] = useState('')
  const [platform, setPlatform] = useState('端游')
  const [notes, setNotes] = useState('')
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  const estimatedPrice = harvardCoins ? calculatePrice(Number(harvardCoins), runner.pricePer10M) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOrderSubmitted(true)
  }

  if (orderSubmitted) {
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

        <Link href="/">
          <button className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-full font-medium transition">
            返回首页
          </button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-3">游戏平台</label>
        <div className="flex gap-3">
          {['端游', '手游'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`flex-1 py-3 rounded-xl border transition ${
                platform === p
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
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
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
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
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!harvardCoins || runner.status !== 'online'}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-xl shadow-blue-600/30 transition hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {runner.status === 'online' ? '提交订单 - 查看联系方式' : '跑手当前不在线'}
      </button>
    </form>
  )
}
