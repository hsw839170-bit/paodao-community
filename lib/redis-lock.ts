/**
 * Redis 分布式锁抽象层
 * 
 * 使用方式:
 * ```
 * const lock = await acquireLock(`order:claim:${orderId}`, runnerId, 10);
 * if (!lock) {
 *   return { error: '抢单失败，请重试' };
 * }
 * try {
 *   // 执行业务逻辑
 * } finally {
 *   await releaseLock(`order:claim:${orderId}`, runnerId);
 * }
 * ```
 * 
 * 环境要求:
 * - 生产环境: 必须设置 REDIS_URL 环境变量
 * - 开发环境: 无 REDIS_URL 时使用内存 fallback（仅用于本地测试，非生产）
 */

// 内存 fallback 实现（仅用于开发测试）
class MemoryLockStore {
  private locks = new Map<string, { value: string; expiresAt: number }>();

  async set(key: string, value: string, ex: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.locks.get(key);
    
    // 检查是否已过期
    if (existing && existing.expiresAt > now) {
      return false; // 锁已存在且未过期
    }
    
    this.locks.set(key, { value, expiresAt: now + ex * 1000 });
    return true;
  }

  async del(key: string): Promise<void> {
    this.locks.delete(key);
  }

  async get(key: string): Promise<string | null> {
    const lock = this.locks.get(key);
    if (!lock) return null;
    if (lock.expiresAt < Date.now()) {
      this.locks.delete(key);
      return null;
    }
    return lock.value;
  }

  // 清理过期锁（可选，防止内存泄漏）
  cleanup(): void {
    const now = Date.now();
    for (const [key, lock] of Array.from(this.locks.entries())) {
      if (lock.expiresAt < now) {
        this.locks.delete(key);
      }
    }
  }
}

// 全局内存锁实例（仅开发环境使用）
const memoryLock = new MemoryLockStore();

// 定期清理内存锁（每 60 秒）
if (typeof setInterval !== 'undefined') {
  setInterval(() => memoryLock.cleanup(), 60000);
}

/**
 * 获取锁实现
 * 优先使用 Redis，无 REDIS_URL 时使用内存 fallback
 */
async function getLockClient() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    // ⚠️ 开发环境 fallback，生产环境必须使用 Redis
    console.warn('[REDIS] REDIS_URL not set, using memory fallback (DEV ONLY)');
    return { type: 'memory' as const, client: memoryLock };
  }

  // 动态导入 ioredis（避免无 REDIS_URL 时的依赖错误）
  try {
    // @ts-ignore - 动态导入，类型在运行时检查
    const Redis = await import('ioredis').then(m => m.default || m);
    const redis = new Redis(redisUrl);
    return { type: 'redis' as const, client: redis };
  } catch (error) {
    console.error('[REDIS] Failed to connect to Redis:', error);
    console.warn('[REDIS] Falling back to memory lock (DEV ONLY)');
    return { type: 'memory' as const, client: memoryLock };
  }
}

/**
 * 获取分布式锁
 * @param key 锁的键名
 * @param value 锁的值（通常为 runnerId，用于释放时验证）
 * @param ttlSeconds 锁的过期时间（秒）
 * @returns 是否成功获取锁
 */
export async function acquireLock(
  key: string,
  value: string,
  ttlSeconds: number = 10
): Promise<boolean> {
  const { type, client } = await getLockClient();

  if (type === 'redis') {
    // Redis SET key value EX seconds NX
    const result = await (client as any).set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } else {
    // 内存 fallback
    return (client as MemoryLockStore).set(key, value, ttlSeconds);
  }
}

/**
 * 释放分布式锁
 * @param key 锁的键名
 * @param value 锁的值（验证释放者身份）
 * @returns 是否成功释放
 */
export async function releaseLock(key: string, value: string): Promise<boolean> {
  const { type, client } = await getLockClient();

  if (type === 'redis') {
    // 使用 Lua 脚本确保原子性（先验证 value 再删除）
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await (client as any).eval(luaScript, 1, key, value);
    return result === 1;
  } else {
    // 内存 fallback
    const current = await (client as MemoryLockStore).get(key);
    if (current === value) {
      await (client as MemoryLockStore).del(key);
      return true;
    }
    return false;
  }
}

/**
 * 延长锁的过期时间
 * @param key 锁的键名
 * @param value 锁的值（验证身份）
 * @param additionalSeconds 要增加的秒数
 * @returns 是否成功延长
 */
export async function extendLock(
  key: string,
  value: string,
  additionalSeconds: number
): Promise<boolean> {
  const { type, client } = await getLockClient();

  if (type === 'redis') {
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    const result = await (client as any).eval(luaScript, 1, key, value, additionalSeconds);
    return result === 1;
  } else {
    // 内存 fallback 不支持延长，直接返回 true（锁已存在即有效）
    const current = await (client as MemoryLockStore).get(key);
    return current === value;
  }
}

/**
 * 检查锁状态（仅用于调试）
 * @param key 锁的键名
 * @returns 锁的值或 null
 */
export async function getLockValue(key: string): Promise<string | null> {
  const { type, client } = await getLockClient();

  if (type === 'redis') {
    return (client as any).get(key);
  } else {
    return (client as MemoryLockStore).get(key);
  }
}
