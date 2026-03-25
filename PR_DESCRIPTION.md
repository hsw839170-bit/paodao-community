# 🔴 抢单模式修复与增强

## ⚠️ 生产环境重要提示

**必须在 Vercel Dashboard 配置 `REDIS_URL`，否则内存锁在 Serverless 环境下无效，可能导致超卖！**

```
REDIS_URL=redis://username:password@host:port
```

推荐：[Upstash Redis](https://upstash.com/)（免费额度足够）或 [Vercel Redis](https://vercel.com/docs/storage/vercel-redis)

---

## 变更概述

| 项目 | 变更 | 文件 |
|------|------|------|
| 1 | Avatar import 清理（已在之前分支完成） | - |
| 2 | 倒计时实时更新 | `app/public-orders/page.tsx` |
| 3 | 公共订单平台筛选说明 | `app/api/orders/public/route.ts` |
| 4 | Redis 生产环境要求标注 | 本 PR 描述 |
| 5 | 并发测试脚本 | `tests/test-claim-concurrency.js` |

### 详细变更

#### 2. 倒计时实时更新
- 添加 `tick` state，每秒更新一次
- `getTimeLeft` 函数依赖 `tick` 实现实时刷新
- 组件卸载时清除定时器

```tsx
// 实时倒计时：每秒更新一次
useEffect(() => {
  const timer = setInterval(() => {
    setTick(t => t + 1);
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

#### 3. 平台筛选说明
PUBLIC 订单在创建时尚未关联跑手，因此无法按平台筛选。如需支持，需在下单时新增 `platform` 字段。

#### 5. 并发测试脚本
```bash
# 运行并发测试（需先设置 REDIS_URL 以获得真实结果）
node tests/test-claim-concurrency.js <order_id> <runner_token>
```

---

## 必须人工配合的最小清单

### 部署前
- [ ] 在 Vercel Dashboard → Project Settings → Environment Variables 添加 `REDIS_URL`
- [ ] 在 staging 环境执行数据库迁移：`npx prisma migrate deploy`

### 部署后
- [ ] 创建一个 PUBLIC 订单
- [ ] 运行并发测试脚本，验证仅一个跑手能抢单成功
- [ ] 观察日志，确认 Redis 锁正常工作（而非内存 fallback）

---

## 测试验证

### 本地测试（内存 fallback）
```bash
npm run build
# 创建订单后，同时发起多个抢单请求
for i in {1..5}; do
  curl -X PUT -H "Authorization: Bearer <token>" \
    http://localhost:3000/api/orders/<id>/claim &
done
wait
```
预期：仅一条成功（200），其余返回 429/409

### 生产测试（Redis）
配置 `REDIS_URL` 后重复上述测试，结果应一致。

---

## 相关文件

- `app/public-orders/page.tsx` - 抢单大厅页面
- `app/api/orders/public/route.ts` - 公开订单列表 API
- `app/api/orders/[id]/claim/route.ts` - 抢单 API
- `lib/redis-lock.ts` - Redis 分布式锁实现
- `tests/test-claim-concurrency.js` - 并发测试脚本
- `prisma/migrations/20260325173000_add_public_order_mode/migration.sql` - 数据库迁移

---

## 后续优化建议

1. WebSocket 实时推送新订单
2. 短信通知抢单成功
3. 抢单历史记录
4. 平台筛选字段（方案 A）
