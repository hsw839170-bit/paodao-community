# 项目看板（最后更新：2026-03-25）

> 每次打开项目先读这里！严格遵守注意事项，按 TODO/DOING 列表执行。

---

## 1. 项目总览

**DeltaRun**（三角洲跑刀社区信息展示平台）

- **技术栈**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + PostgreSQL (Neon) + Prisma + Redis (ioredis) + JWT + Vercel
- **核心用途**: 展示和撮合"老板-跑手"订单，支持普通指定下单与公开发布抢单两种模式
- **部署地址**: https://paodao-cloud.vercel.app

---

## 2. 数据库模型总览

| 模型 | 用途 |
|------|------|
| **User** | 手机号登录，基础身份信息 |
| **RunnerProfile** | 跑手资料（昵称、头像、平台、定价、在线状态等）|
| **Order** | 订单（PRIVATE指定/PUBLIC抢单、状态流转）|
| **OrderLog** | 订单轨迹日志 |
| **Review** | 评价系统 |
| **Notification** | 站内通知 |

**枚举概览**:
- **角色**: BOSS（老板）/ RUNNER（跑手）/ ADMIN（管理员，预留）
- **平台**: PC（端游）/ MOBILE（手游）/ BOTH（两者都可）
- **跑手状态**: ONLINE（在线）/ OFFLINE（离线）/ BUSY（忙碌中）
- **OrderMode**: PRIVATE（指定跑手）/ PUBLIC（公开发布，可抢单）
- **OrderStatus**: PENDING（待接单）/ ACCEPTED（已接单）/ IN_PROGRESS（进行中）/ COMPLETED（已完成）/ CANCELED（已取消）

---

## 3. API 路由概览

### 认证相关
| 路径 | 说明 |
|------|------|
| `POST /api/auth/register` | 注册（支持跑手/老板双角色绑定）|
| `POST /api/auth/login` | 登录（支持记住我功能）|
| `POST /api/auth/forgot-password` | 发送短信验证码 |
| `POST /api/auth/reset-password` | 重置密码 |
| `POST /api/auth/verify-code` | 验证短信验证码 |
| `POST /api/auth/bind-role` | 角色绑定（同一手机号可绑跑手+老板）|
| `GET /api/auth/me` | 获取当前用户信息 |

### 跑手相关
| 路径 | 说明 |
|------|------|
| `GET /api/runners` | 获取跑手列表 |
| `GET /api/runners/me` | 获取当前跑手资料 |
| `PUT /api/runners/update` | 更新跑手资料 |
| `GET /api/runners/[id]` | 获取单个跑手详情 |
| `GET /api/runners/[id]/reviews` | 获取跑手评价 |
| `GET /api/runners/orders` | 跑手订单列表 |
| `GET /api/admin/runners` | 管理端跑手列表 |

### 订单相关
| 路径 | 说明 |
|------|------|
| `POST /api/orders` | 创建订单（老板）|
| `GET /api/orders` | 获取订单列表 |
| `GET /api/orders/public` | 获取公开订单（抢单大厅）|
| `PUT /api/orders/[id]/accept` | 跑手接单 |
| `PUT /api/orders/[id]/claim` | 抢单（Redis分布式锁保护）|
| `PUT /api/orders/[id]/complete` | 标记完成 |
| `PUT /api/orders/[id]/cancel` | 取消订单 |
| `PUT /api/orders/[id]/progress` | 更新进度 |
| `POST /api/orders/[id]/review` | 提交评价 |
| `GET /api/orders/[id]/logs` | 获取订单日志 |

### 定时任务
| 路径 | 说明 |
|------|------|
| `POST /api/cron/check-expired-orders` | 检查超时订单（24小时自动完成）|

---

## 4. 功能模块说明

### 认证系统 (`lib/auth.ts`)
- JWT 签发与验证，强制要求设置 `JWT_SECRET` 环境变量
- 支持记住我功能：勾选 30 天 / 不勾选 1 天 Token 有效期

### 跑手状态计算 (`lib/runner-status.ts`)
- **半自动状态管理**:
  - ONLINE / OFFLINE：跑手手动切换（个人中心「我要上线/下线」按钮）
  - BUSY：自动计算（有 ACCEPTED 订单时自动显示）

### Redis 分布式锁 (`lib/redis-lock.ts`)
- 支持生产环境 Redis 和开发环境内存 fallback
- Lua 脚本保证原子性释放
- 用于抢单并发保护（`order:claim:<id>` 锁）

### 验证码管理 (`lib/verification-codes.ts`)
- 内存存储（开发）/ Redis（生产）
- 频率限制：每分钟最多 3 次
- 验证码有效期：5 分钟

### 首页筛选与统计 (`app/page.tsx`)
- SSR 服务端渲染，首次加载无闪烁
- 支持平台筛选（端游/手游/两者都可）和价格区间筛选
- 统计卡片展示总数/在线/忙碌跑手数量

---

## 5. 核心页面索引

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 跑手列表 + 筛选 + 统计卡片 |
| 登录 | `/login` | 手机号登录，支持记住我 |
| 注册 | `/register` | 两步骤表单注册（老板/跑手）|
| 个人中心 | `/profile` | 跑手资料展示 |
| 资料编辑 | `/profile/edit` | 资料修改 + 上下线状态切换 |
| 下单页面 | `/order/[id]` | 创建订单/查看跑手详情 |
| 我的订单 | `/my-orders` | 老板订单列表 |
| 跑手订单 | `/profile/orders` | 跑手订单管理 |
| 订单详情 | `/profile/orders/[id]` | 订单详情 + 操作按钮 |
| 抢单大厅 | `/public-orders` | 公开发布订单列表 |
| 排行榜 | `/leaderboard` | 收入榜/订单榜/评分榜 |
| 忘记密码 | `/forgot-password` | 短信验证码重置密码 |
| 法律页面 | `/legal/*` | 用户协议/隐私政策/免责声明 |

---

## 6. 环境变量一览

### 必需
| 变量名 | 用途 |
|--------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 |
| `JWT_SECRET` | JWT 签名密钥（生产环境必须设置）|

### 建议配置（生产环境）
| 变量名 | 用途 |
|--------|------|
| `REDIS_URL` | Redis 连接字符串（抢单功能需要）|
| `CRON_SECRET` | 定时任务调用密钥（防止恶意触发）|
| `FEATURE_SMS_VERIFY` | 是否启用短信验证（`true`/`false`）|
| `SMS_API_KEY` | 短信服务 API 密钥 |
| `SMS_PROVIDER` | 短信服务商（`aliyun`/`tencent`/`twilio`）|

---

## 7. 最新进度快照（2026-03-25 21:00）

### 已完成
- 用户系统：注册/登录/JWT认证/角色区分（老板/跑手）
- 跑手管理：资料编辑、头像、价格设置、手动在线/离线切换
- 在线状态：半自动逻辑（ONLINE/OFFLINE 手动切换，BUSY 由订单自动计算）
- 订单系统：创建/接单/完成/评价/取消 全流程
- 评价系统：订单完成后可评价，带星级和评论
- 搜索筛选：首页支持平台筛选和价格区间筛选
- 24小时自动完成：ACCEPTED 状态订单超时自动标记为 COMPLETED
- 抢单模式：Redis 分布式锁 + 并发保护 + 实时倒计时

### 待办 (P1/P2)
- **P1**: 配置生产环境 `REDIS_URL`（抢单功能需要）
- **P1**: 抢单功能最终验证（需人工并发测试确认）
- **P2**: 短信服务配置（忘记密码功能生产环境需要）
- **P2**: 头像本地上传（S3/R2，当前为 URL 输入）
- **P2**: 跑手端订单详情/取消页面进一步优化

### 已知问题
1. **Cron 配置与代码注释不一致**: `vercel.json` 中 cron 设置为 `0 0 * * *`（每天一次），但代码注释和预期是每 5 分钟 (`*/5 * * * *`)
2. **PUBLIC 订单平台筛选限制**: PUBLIC 订单创建时未关联跑手，无法按平台筛选（需在下单时新增 platform 字段）
3. **组件文件引用**: 部分组件引用待整理（`app/components/FilterBar.tsx`、`app/components/StatsCards.tsx`）

### 下一步建议
1. **高优先级**: 抢单模式完善 + 并发测试验证
2. **中优先级**: 配置短信服务用于生产环境忘记密码功能
3. **中优先级**: 修正 `vercel.json` cron 频率配置
4. **低优先级**: 头像本地上传功能（S3/R2 接入）
5. **低优先级**: 域名访问问题排查（https://paodao-cloud.vercel.app 访问异常）

---

## 历史进度快照

### 进度快照（2026-03-25 20:40）
- 抢单模式完整实现：Redis 分布式锁 + 并发保护 + 实时倒计时
- 抢单大厅页面：`/public-orders` + 首页"抢单大厅"入口按钮
- 数据库迁移：OrderMode/PUBLIC 模式 + claimDeadline 字段已添加
- API 路由：`GET /api/orders/public` + `PUT /api/orders/[id]/claim`
- Redis 锁实现：`lib/redis-lock.ts`（内存 fallback + Redis 生产支持）
- 测试脚本：`tests/test-claim-concurrency.js` 并发测试

### 进度快照（2026-03-25 17:25）
- 跑手端订单详情页：`/profile/orders/[id]` 新增详情页
- 订单取消功能：`PUT /api/orders/[id]/cancel` API
- 首页统计卡片点击：StatsCards 组件支持点击筛选
- 抢单模式 scaffold：public-orders 页面、抢单 API stub

---

## 注意事项

- **技术栈**: Next.js 14 App Router + Prisma + PostgreSQL
- **部署模式**: SSR 模式（已移除 `output: 'export'`），API 路由已启用
- **数据库**: Neon PostgreSQL 已连接
- **代码风格**: 函数组件 + TypeScript，表单用受控组件

---

## 待办（TODO）

- [ ] **P2** 头像上传 - 从 URL 输入改为本地上传（S3/R2，低优先级）
- [ ] **P2** 配置短信服务 - 忘记密码功能需要（阿里云/腾讯云/Twilio）

---

## 进行中（DOING）

- [ ] 域名访问问题排查（见下方「当前问题与下一步」）

---

## 已完成（DONE）

- [x] 切换到 SSR 模式（移除 `output: 'export'`）
- [x] 配置 Neon PostgreSQL 数据库
- [x] 安装依赖并执行迁移（bcryptjs, jsonwebtoken, @types/*）
- [x] 基础 Next.js 项目搭建
- [x] Prisma schema 定义（User + RunnerProfile）
- [x] JWT 工具封装 (`lib/auth.ts`)
- [x] API 路由（注册/登录/获取资料/更新资料/管理端列表）
- [x] 登录页面 (`/login`)
- [x] 注册页面 - 两步骤表单 (`/register`)
- [x] 个人中心 (`/profile`)
- [x] 资料编辑页 (`/profile/edit`)
- [x] 管理端跑手列表 (`/admin/runners`)
- [x] 首页跑手展示
- [x] 排行榜页面
- [x] 法律页面（用户协议、隐私政策、免责声明）
- [x] 生产部署到 Vercel
- [x] 订单页面改为服务端获取真实数据 (`/order/[id]`)
- [x] 价格筛选功能（平台 + 价格区间）
- [x] 订单超时自动完成机制（24 小时）
- [x] 登录记住我功能（30 天免登录）
- [x] 忘记密码功能（短信验证码重置）
- [x] 首页 SSR 优化

---

## 当前问题与下一步

### 当前问题：主域名访问异常

**现象**:
- 预览地址正常: https://paodao-cloud-11fwz7z56-hsw839170-9786s-projects.vercel.app
- 主地址报错: https://paodao-cloud.vercel.app 出现 `ERR_CONNECTION_CLOSED`

**已确认不是代码问题**:
- `next.config.js` 无 basePath/redirects/rewrites 限制
- `vercel.json` 为标准配置，无域名限制
- Vercel 构建成功，aliased 到主域名
- 预览地址可正常访问

**根因判断**: Vercel 域名绑定或本地网络问题

---

### 你需要执行的操作清单

#### A. 必做（Vercel Dashboard 检查）

**A1. 检查域名配置**
- 路径: Vercel Dashboard → 项目 `paodao-cloud` → **Settings** → **Domains**
- 检查:
  - [ ] `paodao-cloud.vercel.app` 是否在列表中
  - [ ] 状态是否为 **"Valid"**（绿色）
  - [ ] 无其他冲突域名

**A2. 检查生产部署绑定**
- 路径: Vercel Dashboard → **Deployments**
- 检查:
  - [ ] 最新部署标记为 **Production**
  - [ ] 域名指向正确部署

**A3. 重新部署（清除缓存）**
- 路径: Vercel Dashboard → **Deployments** → 最新部署 → **Redeploy**
- 操作: 取消勾选 "Use existing Build Cache"

#### B. 建议做（本机排查）

| 操作 | 命令/方法 |
|------|----------|
| 换浏览器/无痕模式 | Chrome 无痕窗口访问 |
| 换网络（手机热点）| 排除本地网络问题 |
| 关闭 VPN/代理 | 排除代理干扰 |
| 刷新 DNS 缓存 | `ipconfig /flushdns` |
| 命令行诊断 | `curl -I https://paodao-cloud.vercel.app` |
| 查看域名解析 | `nslookup paodao-cloud.vercel.app` |

#### C. 可选（进阶）

- [ ] 绑定自定义域名（如 deltarun.io）
- [ ] 启用 Vercel Analytics 监控访问

---

### 下一步建议

**做完 A 类检查后告诉我结果**:
1. Domains 页面显示什么状态？
2. 重新部署后主地址是否恢复？
3. 换网络/浏览器后是否仍报错？

根据结果决定是否需要进一步排查。

---

*修改记录:*
- 2026-03-25 21:00 - 更新项目总览与进度快照（新增数据库模型、API路由、功能模块、环境变量、已知问题）
- 2026-03-25 - P0 Bug 修复（订单状态、上线/下线按钮、身份体系临时补丁）
- 2026-03-25 - 忘记密码功能（短信验证码重置）
- 2026-03-25 - 首页 SSR 优化（无闪烁加载）
- 2026-03-25 - 登录记住我功能（30天/1天 Token 有效期）
- 2026-03-25 - 订单超时自动完成机制（ACCEPTED 24小时后自动完成）
- 2026-03-25 - 价格筛选功能完成（平台 + 价格区间）
- 2026-03-25 - 进度快照：订单系统完成，在线状态逻辑重构，trailingSlash 修复
- 2026-03-24 23:05 - 更新看板：SSR 和数据库已完成，新增域名访问问题排查
- 2026-03-24 22:05 - 重构看板，按 GPT-5.4 建议简化结构


<!-- encoding: UTF-8 -->
