'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const PRICE_RANGES = [
  { label: '全部价格', min: '', max: '' },
  { label: '¥10以下', min: '0', max: '10' },
  { label: '¥10-15', min: '10', max: '15' },
  { label: '¥15-20', min: '15', max: '20' },
  { label: '¥20以上', min: '20', max: '' },
]

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [platform, setPlatform] = useState(searchParams.get('platform') || 'ALL')
  const [priceRange, setPriceRange] = useState(() => {
    const min = searchParams.get('minPrice')
    const max = searchParams.get('maxPrice')
    const index = PRICE_RANGES.findIndex(r => r.min === min && r.max === max)
    return index >= 0 ? index : 0
  })

  const updateFilter = (newPlatform?: string, newPriceIndex?: number) => {
    const params = new URLSearchParams()
    
    const p = newPlatform ?? platform
    const idx = newPriceIndex ?? priceRange
    
    if (p !== 'ALL') {
      params.set('platform', p)
    }
    
    const range = PRICE_RANGES[idx]
    if (range.min) params.set('minPrice', range.min)
    if (range.max) params.set('maxPrice', range.max)
    
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  const handlePlatformChange = (key: string) => {
    setPlatform(key)
    updateFilter(key, undefined)
  }

  const handlePriceChange = (index: number) => {
    setPriceRange(index)
    updateFilter(undefined, index)
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4 mb-8">
      <div className="flex flex-wrap gap-4 items-center">
        {/* 平台筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm whitespace-nowrap">平台：</span>
          <div className="flex gap-2">
            {[
              { key: 'ALL', label: '全部' },
              { key: 'PC', label: '端游' },
              { key: 'MOBILE', label: '手游' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => handlePlatformChange(item.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  platform === item.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="hidden md:block w-px h-8 bg-slate-700"></div>

        {/* 价格筛选 */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-slate-400 text-sm whitespace-nowrap">价格：</span>
          <div className="flex gap-2 flex-wrap">
            {PRICE_RANGES.map((range, index) => (
              <button
                key={index}
                onClick={() => handlePriceChange(index)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  priceRange === index
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
