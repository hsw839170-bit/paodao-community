'use client'

import Link from 'next/link'

interface Runner {
  id: string
  name: string
  avatar?: string
  platform: string
  bio?: string
  rating: number
  orders: number
  income: number
  verified: boolean
  computedStatus: 'ONLINE' | 'OFFLINE' | 'BUSY' // 使用计算后的状态
  pricePer10M: number
}

export function RunnerCard({ runner }: { runner: Runner }) {
  // 根据平台选择颜色
  const platformColors: Record<string, string> = {
    '端游': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    '手游': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    '两者都可': 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-pink-300 border-pink-500/30'
  }

  const platformColor = platformColors[runner.platform] || platformColors['端游']
  
  // 状态显示 - 使用 computedStatus
  const statusConfig = {
    ONLINE: { text: '在线', color: 'bg-green-500', dot: 'animate-pulse' },
    OFFLINE: { text: '离线', color: 'bg-slate-500', dot: '' },
    BUSY: { text: '忙碌中', color: 'bg-yellow-500', dot: 'animate-pulse' }
  }
  const status = statusConfig[runner.computedStatus] || statusConfig.OFFLINE

  // 是否可以下单：只有 ONLINE 可以，BUSY 和 OFFLINE 都不行
  const canOrder = runner.computedStatus === 'ONLINE'

  return (
    <div className="group relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
      {/* 顶部装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-5">
        {/* 头像 */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {runner.name[0]}
          </div>
          {runner.verified && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm border-4 border-slate-800">
              ✓
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">{runner.name}</h3>
                {/* 状态指示 - 使用 computedStatus */}
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${status.color}/20 text-${status.color === 'bg-green-500' ? 'green' : status.color === 'bg-yellow-500' ? 'yellow' : 'slate'}-300`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.color} ${status.dot}`} />
                  {status.text}
                </span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${platformColor}`}>
                {runner.platform}
              </span>
            </div>
            
            {/* 评分 */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-400">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-lg font-bold">{runner.rating}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{runner.orders} 单</div>
            </div>
          </div>

          {/* 简介 */}
          {runner.bio && (
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{runner.bio}</p>
          )}

          {/* 定价信息 */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-slate-300">1000W哈夫币</span>
            <span className="text-lg font-bold text-green-400">= ¥{runner.pricePer10M}</span>
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>联系方式已隐藏</span>
            </div>

            <Link href={`/order/${runner.id}`}>
              <button 
                disabled={!canOrder}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-full text-sm font-medium transition shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/40 flex items-center gap-2"
              >
                {canOrder ? (
                  <>
                    立即下单
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                ) : (
                  runner.computedStatus === 'BUSY' ? '跑手忙碌中' : '跑手离线中'
                )}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
