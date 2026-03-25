'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface StatsCardsProps {
  totalCount: number
  onlineCount: number
  busyCount: number
}

export default function StatsCards({ totalCount, onlineCount, busyCount }: StatsCardsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobile, setIsMobile] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleCardClick = (type: 'ALL' | 'ONLINE' | 'BUSY') => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (type === 'ALL') {
      params.set('status', 'ALL')
      setModalTitle('全部跑手')
    } else if (type === 'ONLINE') {
      params.set('status', 'ONLINE')
      setModalTitle('在线可接单')
    } else {
      params.set('status', 'BUSY')
      setModalTitle('忙碌中')
    }

    if (isMobile) {
      // 移动端：跳转页面
      router.push(`/?${params.toString()}`)
    } else {
      // 桌面端：打开弹窗并更新URL
      setModalOpen(true)
      router.push(`/?${params.toString()}`, { scroll: false })
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto">
        <div 
          onClick={() => handleCardClick('ALL')}
          className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500/50 transition cursor-pointer hover:bg-slate-700/50"
        >
          <div className="text-3xl font-bold text-blue-400 mb-1">{totalCount}</div>
          <div className="text-sm text-slate-400">入驻跑手</div>
        </div>
        <div 
          onClick={() => handleCardClick('ONLINE')}
          className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center hover:border-green-500/50 transition cursor-pointer hover:bg-slate-700/50"
        >
          <div className="text-3xl font-bold text-green-400 mb-1">{onlineCount}</div>
          <div className="text-sm text-slate-400">在线可接单</div>
        </div>
        <div 
          onClick={() => handleCardClick('BUSY')}
          className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center hover:border-yellow-500/50 transition cursor-pointer hover:bg-slate-700/50"
        >
          <div className="text-3xl font-bold text-yellow-400 mb-1">{busyCount}</div>
          <div className="text-sm text-slate-400">忙碌中</div>
        </div>
      </div>

      {/* Modal for desktop */}
      {modalOpen && !isMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModalOpen(false)}>
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{modalTitle}</h3>
            <p className="text-slate-400 mb-6">已更新筛选条件，请查看下方列表。</p>
            <button 
              onClick={() => setModalOpen(false)}
              className="w-full py-3 bg-blue-600 rounded-lg font-medium hover:bg-blue-500 transition"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  )
}
