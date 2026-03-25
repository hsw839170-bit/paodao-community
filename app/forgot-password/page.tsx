'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: 输入手机号, 2: 输入验证码和新密码
  const [formData, setFormData] = useState({
    phone: '',
    code: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // 发送验证码
  const handleSendCode = async () => {
    if (!formData.phone || !/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError('请输入正确的手机号')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '发送失败')
      }

      // 开发环境：如果返回了验证码，自动填入
      if (data.code) {
        setFormData(prev => ({ ...prev, code: data.code }))
      }

      setStep(2)
      setCountdown(60)
      
      // 倒计时
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer)
            return 0
          }
          return c - 1
        })
      }, 1000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 重置密码
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度不能少于6位')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          code: formData.code,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '重置失败')
      }

      // 重置成功，跳转到登录页
      alert('密码重置成功！请使用新密码登录')
      router.push('/login')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">忘记密码</h1>
          <p className="text-slate-400">{step === 1 ? '输入手机号获取验证码' : '设置新密码'}</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  手机号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="请输入注册时的手机号"
                />
              </div>

              <button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/30 transition hover:shadow-xl disabled:opacity-50"
              >
                {loading ? '发送中...' : '获取验证码'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  验证码 {countdown > 0 && <span className="text-blue-400">({countdown}s)</span>}
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="请输入6位验证码"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  新密码
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="至少6位"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="再次输入新密码"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/30 transition hover:shadow-xl disabled:opacity-50"
              >
                {loading ? '重置中...' : '重置密码'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 text-slate-400 hover:text-white transition"
              >
                ← 返回上一步
              </button>
            </form>
          )}
        </div>

        {/* 返回登录 */}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-slate-500 hover:text-slate-300 text-sm transition">
            ← 返回登录
          </Link>
        </div>
      </div>
    </main>
  )
}
