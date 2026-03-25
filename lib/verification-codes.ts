// 验证码管理模块
// 支持：内存存储（开发）/ Redis（生产）

// 环境变量开关
const FEATURE_SMS_VERIFY = process.env.FEATURE_SMS_VERIFY === 'true'
const SMS_RATE_LIMIT_PER_MINUTE = parseInt(process.env.SMS_RATE_LIMIT_PER_MINUTE || '3')
const SMS_CODE_TTL_MS = parseInt(process.env.SMS_CODE_TTL_MS || '300000') // 默认 5 分钟

// 内存存储（开发环境）
interface CodeData {
  code: string
  expires: number
  sendCount: number // 发送次数（用于限制）
  firstSendAt: number // 首次发送时间
}

const verificationCodes = new Map<string, CodeData>()

// 清理过期验证码（每小时）
setInterval(() => {
  const now = Date.now()
  verificationCodes.forEach((data, phone) => {
    if (data.expires < now) {
      verificationCodes.delete(phone)
    }
  })
}, 60 * 60 * 1000)

// 检查是否启用短信验证
export function isSmsVerifyEnabled(): boolean {
  return FEATURE_SMS_VERIFY
}

// 检查发送频率限制
export function checkRateLimit(phone: string): { allowed: boolean; message?: string; remaining?: number } {
  const data = verificationCodes.get(phone)
  const now = Date.now()
  
  if (!data) {
    return { allowed: true, remaining: SMS_RATE_LIMIT_PER_MINUTE }
  }
  
  // 检查是否在 1 分钟内
  const oneMinuteAgo = now - 60 * 1000
  if (data.firstSendAt > oneMinuteAgo) {
    // 1 分钟内
    if (data.sendCount >= SMS_RATE_LIMIT_PER_MINUTE) {
      const retryAfter = Math.ceil((data.firstSendAt + 60 * 1000 - now) / 1000)
      return { 
        allowed: false, 
        message: `发送过于频繁，请 ${retryAfter} 秒后重试`,
        remaining: 0
      }
    }
    return { allowed: true, remaining: SMS_RATE_LIMIT_PER_MINUTE - data.sendCount }
  } else {
    // 超过 1 分钟，重置计数
    return { allowed: true, remaining: SMS_RATE_LIMIT_PER_MINUTE }
  }
}

// 存储验证码
export function storeCode(phone: string, code: string): void {
  const now = Date.now()
  const existing = verificationCodes.get(phone)
  
  if (existing && existing.firstSendAt > now - 60 * 1000) {
    // 1 分钟内再次发送，递增计数
    existing.sendCount++
    existing.code = code
    existing.expires = now + SMS_CODE_TTL_MS
  } else {
    // 新发送或超过 1 分钟
    verificationCodes.set(phone, {
      code,
      expires: now + SMS_CODE_TTL_MS,
      sendCount: 1,
      firstSendAt: now
    })
  }
}

// 验证验证码
export function verifyCode(phone: string, code: string): boolean {
  const data = verificationCodes.get(phone)
  if (!data) return false
  if (data.expires < Date.now()) {
    verificationCodes.delete(phone)
    return false
  }
  return data.code === code
}

// 删除已使用的验证码
export function deleteCode(phone: string): void {
  verificationCodes.delete(phone)
}

// 获取验证码（仅用于开发/测试）
export function getCodeForDev(phone: string): string | null {
  if (process.env.NODE_ENV === 'production') {
    return null
  }
  const data = verificationCodes.get(phone)
  return data?.code || null
}

// 统计信息（用于监控）
export function getStats(): { totalCodes: number; activeCodes: number } {
  const now = Date.now()
  let active = 0
  verificationCodes.forEach((data) => {
    if (data.expires > now) active++
  })
  return {
    totalCodes: verificationCodes.size,
    activeCodes: active
  }
}
