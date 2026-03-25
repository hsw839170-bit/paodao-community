'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [platform, setPlatform] = useState(searchParams.get('platform') || 'ALL')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [error, setError] = useState('')

  const validatePrice = (min: string, max: string): boolean => {
    setError('')
    
    if (!min && !max) return true
    
    const minNum = min ? parseInt(min) : null
    const maxNum = max ? parseInt(max) : null
    
    if (min && (isNaN(minNum!) || minNum! < 0)) {
      setError('最低价格必须是大于等于 0 的数字')
      return false
    }
    
    if (max && (isNaN(maxNum!) || maxNum! <= 0)) {
      setError('最高价格必须是大于 0 的数字')
      return false
    }
    
    if (minNum !== null && maxNum !== null && minNum > maxNum) {
      setError('最低价格不能大于最高价格')
      return false
    }
    
    if (minNum !== null && minNum > 100000) {
      setError('价格范围过大（最大 100000）')
      return false
    }
    
    if (maxNum !== null && maxNum > 100000) {
      setError('价格范围过大（最大 100000）')
      return false
    }
    
    return true
  }

  const updateFilter = useCallback(() => {
    if (!validatePrice(minPrice, maxPrice)) return
    
    const params = new URLSearchParams()
    
    if (platform !== 'ALL') {
      params.set('platform', platform)
    }
    
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }, [platform, minPrice, maxPrice, router])

  const handlePlatformChange = (key: string) => {
    setPlatform(key)
    const params = new URLSearchParams()
    
    if (key !== 'ALL') {
      params.set('platform', key)
    }
    
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateFilter()
    }
  }

  const clearFilter = () => {
    setMinPrice('')
    setMaxPrice('')
    setError('')
    const params = new URLSearchParams()
    if (platform !== 'ALL') {
      params.set('platform', platform)
    }
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4 mb-8">
      <div className="flex flex-wrap gap-4 items-start">
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

        {/* 价格筛选 - 自由输入 */}
        <div className="flex items-start gap-2 flex-1 min-w-[280px]">
          <span className="text-slate-400 text-sm whitespace-nowrap pt-2">价格：</span>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="最低"
                className="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                min="0"
                max="100000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="最高"
                className="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-sm">元/1000万</span>
              <button
                onClick={updateFilter}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium text-white transition"
              >
                筛选
              </button>
              {(minPrice || maxPrice) && (
                <button
                  onClick={clearFilter}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition"
                >
                  清除
                </button>
              )}
            </div>
            {error && (
              <span className="text-xs text-red-400">{error}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
