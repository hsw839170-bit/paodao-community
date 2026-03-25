'use client'

import { useState } from 'react'

interface AvatarProps {
  src?: string
  alt?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
}

export default function Avatar({ src, alt = '', className = '', size = 'md' }: AvatarProps) {
  const [error, setError] = useState(false)
  
  // 获取名字首字母作为默认显示
  const initial = alt ? alt[0].toUpperCase() : '?'
  
  // 如果图片加载失败或没有 src，显示默认占位
  if (error || !src) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold`}
      >
        {initial}
      </div>
    )
  }
  
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={`${sizeClasses[size]} ${className} rounded-xl object-cover`}
    />
  )
}
