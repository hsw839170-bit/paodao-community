// 简单的内存存储（生产环境应使用 Redis）
const verificationCodes = new Map<string, { code: string; expires: number }>()

// 清理过期验证码（每小时）
setInterval(() => {
  const now = Date.now()
  verificationCodes.forEach((data, phone) => {
    if (data.expires < now) {
      verificationCodes.delete(phone)
    }
  })
}, 60 * 60 * 1000)

// 存储验证码
export function storeCode(phone: string, code: string): void {
  verificationCodes.set(phone, {
    code,
    expires: Date.now() + 5 * 60 * 1000 // 5分钟有效
  })
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
