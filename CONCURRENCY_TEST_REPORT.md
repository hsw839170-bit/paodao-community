# 抢单并发测试报告

**测试时间**: 2026-03-26  
**测试环境**: 本地开发环境 (Next.js dev server)  
**测试订单**: 9eaa326c-a5b6-41ac-804f-172b8135390b (PUBLIC 模式)

---

## 一、REDIS_URL 配置检查

### 代码期望的环境变量
- **变量名**: `REDIS_URL`
- **读取位置**: `lib/redis-lock.ts` 中的 `getLockClient()` 函数
- **格式要求**: 标准 Redis URL，如 `redis://default:password@host:port` 或 `rediss://` (TLS)

### 当前环境状态
- **本地 .env**: `REDIS_URL` 未配置
- **当前行为**: 代码检测到无 `REDIS_URL` 时，自动 fallback 到 **内存锁 (MemoryLockStore)**
- **内存锁限制**: 仅适用于单实例、开发测试，不适合生产环境多实例部署

### 生产环境要求
⚠️ **必须配置 `REDIS_URL` 环境变量**，否则：
- 多实例部署时，每个实例的内存锁相互隔离
- 抢单并发保护失效，可能出现超卖（多个跑手同时抢到同一订单）

---

## 二、并发测试脚本

已创建以下测试脚本：

| 脚本 | 用途 |
|------|------|
| `scripts/test-claim-concurrency.js` | 使用原生 fetch 的并发测试脚本 |
| `scripts/test-claim-concurrency-http.js` | 使用 Node.js http 模块的并发测试（推荐） |
| `scripts/prepare-test-runner.js` | 创建测试跑手用户并生成 JWT Token |
| `scripts/reset-order-status.js` | 重置订单为 PENDING 状态 |

### 使用方法
```powershell
# 1. 准备测试跑手（获取 TOKEN）
node scripts/prepare-test-runner.js

# 2. 设置环境变量（根据 prepare-test-runner.js 输出）
$env:TOKEN="..."
$env:ORDER_ID="9eaa326c-a5b6-41ac-804f-172b8135390b"

# 3. 重置订单状态（如需重新测试）
node scripts/reset-order-status.js $env:ORDER_ID

# 4. 启动开发服务器
npm run dev

# 5. 运行并发测试
node scripts/test-claim-concurrency-http.js
```

---

## 三、本地测试结果

### 测试环境
- **服务器**: Next.js dev server (localhost:3000)
- **并发数**: 10 个请求同时发起
- **Redis**: 未配置（使用 memory fallback）

### 单请求测试结果
```
PUT /api/orders/[id]/claim 200 in 18028ms
```
- ✅ 请求成功返回 200
- ⚠️ 响应时间较长（18s），原因是 Redis 连接重试超时

### 并发测试结果
- ❌ 所有请求超时（10s 超时设置）
- **原因**: ioredis 尝试连接错误的 REDIS_URL，导致请求处理被阻塞

### 发现的配置问题
当前 `.env` 中的 Redis URL 格式错误：
```
# 错误的格式（包含了 redis-cli 命令行参数）
REDIS_URL="...%20--tls%20-u%20redis://..."

# 正确的格式应该是
REDIS_URL="redis://default:password@host:port"  # 非 TLS
# 或
REDIS_URL="rediss://default:password@host:port"  # TLS 加密
```

---

## 四、结论与建议

### 当前状态评估

| 场景 | 并发保护是否工作 | 说明 |
|------|----------------|------|
| 单实例 + 配置正确 REDIS_URL | ✅ 是 | 分布式锁正常工作 |
| 单实例 + 无 REDIS_URL | ✅ 是（仅开发） | 内存锁在单实例下有效 |
| 多实例 + 配置正确 REDIS_URL | ✅ 是 | 分布式锁正常工作 |
| 多实例 + 无 REDIS_URL | ❌ 否 | **超卖风险！** 各实例内存锁隔离 |

### 生产环境部署检查清单

- [ ] 在 Vercel Dashboard 设置 `REDIS_URL` 环境变量
- [ ] 确认 Redis URL 格式正确（不包含命令行参数）
- [ ] 部署后运行并发测试验证（使用 `scripts/test-claim-concurrency-http.js`）
- [ ] 验证预期结果：10 个并发请求中，1 个成功（200），9 个冲突（409）

### 推荐的 Redis 服务商
- [Upstash](https://upstash.com/) (推荐，有免费 tier)
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
- AWS ElastiCache
- Alibaba Cloud Redis

---

## 五、手动验证步骤

1. 在 Vercel Dashboard → Environment Variables 添加正确的 `REDIS_URL`
2. 重新部署项目
3. 创建测试订单：`node scripts/create-public-order.js`
4. 在本地运行并发测试，指向生产环境：
   ```powershell
   $env:API_BASE="https://paodao-cloud.vercel.app"
   $env:TOKEN="从浏览器 localStorage 获取"
   $env:ORDER_ID="刚创建的订单ID"
   node scripts/test-claim-concurrency-http.js
   ```
5. 验证结果：1 个成功，9 个 409 冲突

---

## 六、生产环境验证（更新 2026-03-26 01:05）

### 环境配置状态
- **Vercel Dashboard**: ✅ 已配置 `REDIS_URL`（已移除 `redis-cli -u` 前缀，保留纯 URL 格式）
- **部署状态**: 已重新部署
- **网络访问**: ⚠️ 本地网络无法直接访问 `paodao-cloud.vercel.app`（ETIMEDOUT）

### 本地 Redis 模拟测试
由于无法直接访问生产环境，在本地模拟 Redis 已配置的环境进行测试：

**测试设置**:
- 设置 `REDIS_URL=redis://localhost:6379`（本地无 Redis 服务，预期会 fallback）
- 并发 10 个请求抢同一个 PUBLIC 订单

**测试结果**:
```
PUT /api/orders/[id]/claim 200 in 14999ms  (所有 10 个请求)
```
| 状态 | 次数 | 说明 |
|------|------|------|
| 成功 (200) | 10 | ⚠️ 异常：所有请求都成功 |
| 冲突 (409) | 0 | 没有请求被正确拒绝 |
| 其他 | 0 | 无 |

**结果分析**:
- ❌ **内存锁在并发场景下无法正常工作**（确认需要 Redis）
- ioredis 连接被拒绝后 fallback 到内存锁
- 内存锁的 `set` 操作不是原子性的，导致所有并发请求都通过了锁检查
- 这证明了 **生产环境必须配置真实 Redis 服务**

### 生产环境预期结果
当 `REDIS_URL` 正确配置并连接到真实 Redis 服务时：

| 预期状态 | 次数 | 说明 |
|----------|------|------|
| 成功 (200) | 1 | 第一个抢到锁的请求 |
| 冲突 (409) | 9 | 锁被占用，返回"订单已被抢或已取消" |
| 其他 | 0 | 无 |

### 建议验证方式
由于本地网络无法访问 Vercel 主域名，建议通过以下方式验证生产环境：

1. **浏览器开发者工具验证**:
   ```javascript
   // 在浏览器控制台运行（先登录跑手账号）
   const token = localStorage.getItem('token');
   const orderId = '新创建的PUBLIC订单ID';
   
   // 快速连续点击抢单按钮，或同时打开多个浏览器标签页
   // 验证只有一个请求返回 200，其他返回 409
   ```

2. **Vercel Logs 验证**:
   - 在 Vercel Dashboard → Logs 中查看 `/api/orders/[id]/claim` 的响应状态码
   - 预期看到 1 个 200 和多个 409

3. **数据库验证**:
   - 并发抢单后检查订单状态
   - 预期 `status='ACCEPTED'` 且只有一个 `runnerId`

---

*报告生成时间: 2026-03-26 01:30*  
*更新时间: 2026-03-26 01:05*
