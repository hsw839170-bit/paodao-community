# 项目看板（最后更新：2026-03-25）

> 每次打开项目先读这里！严格遵守注意事项，按 TODO/DOING 列表执行。

---

## 1. 注意事项

- **技术栈**: Next.js 14 App Router + Prisma + PostgreSQL
- **部署模式**: ✅ SSR 模式（已移除 `output: 'export'`），API 路由已启用
- **数据库**: ✅ Neon PostgreSQL 已连接
- **代码风格**: 函数组件 + TypeScript，表单用受控组件

---

## 2. 待办（TODO）

- [ ] **P2** 头像上传 - 从 URL 输入改为本地上传（S3/R2，低优先级）
- [ ] **P2** 配置短信服务 - 忘记密码功能需要（阿里云/腾讯云/Twilio）

---

## 3. 进行中（DOING）

- [ ] 域名访问问题排查（见下方「当前问题与下一步」）

---

## 4. 已完成（DONE）

- [x] ✅ 切换到 SSR 模式（移除 `output: 'export'`）
- [x] ✅ 配置 Neon PostgreSQL 数据库
- [x] ✅ 安装依赖并执行迁移（bcryptjs, jsonwebtoken, @types/*）
- [x] ✅ 基础 Next.js 项目搭建
- [x] ✅ Prisma schema 定义（User + RunnerProfile）
- [x] ✅ JWT 工具封装 (`lib/auth.ts`)
- [x] ✅ API 路由（注册/登录/获取资料/更新资料/管理端列表）
- [x] ✅ 登录页面 (`/login`)
- [x] ✅ 注册页面 - 两步骤表单 (`/register`)
- [x] ✅ 个人中心 (`/profile`)
- [x] ✅ 资料编辑页 (`/profile/edit`)
- [x] ✅ 管理端跑手列表 (`/admin/runners`)
- [x] ✅ 首页跑手展示
- [x] ✅ 排行榜页面
- [x] ✅ 法律页面（用户协议、隐私政策、免责声明）
- [x] ✅ 生产部署到 Vercel
- [x] ✅ 订单页面改为服务端获取真实数据 (`/order/[id]`)
- [x] ✅ 价格筛选功能（平台 + 价格区间）
- [x] ✅ 订单超时自动完成机制（24 小时）
- [x] ✅ 登录记住我功能（30 天免登录）
- [x] ✅ 忘记密码功能（短信验证码重置）
- [x] ✅ 首页 SSR 优化

---

## 5. 当前问题与下一步

### 🔴 当前问题：主域名访问异常

**现象**:
- ✅ 预览地址正常: https://paodao-cloud-11fwz7z56-hsw839170-9786s-projects.vercel.app
- ❌ 主地址报错: https://paodao-cloud.vercel.app → `ERR_CONNECTION_CLOSED`

**已确认不是代码问题**:
- ✅ `next.config.js` 无 basePath/redirects/rewrites 限制
- ✅ `vercel.json` 为标准配置，无域名限制
- ✅ Vercel 构建成功，aliased 到主域名
- ✅ 预览地址可正常访问

**根因判断**: Vercel 域名绑定或本地网络问题

---

### 📋 你需要执行的操作清单

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

### 🎯 下一步建议

**做完 A 类检查后告诉我结果**:
1. Domains 页面显示什么状态？
2. 重新部署后主地址是否恢复？
3. 换网络/浏览器后是否仍报错？

根据结果决定是否需要进一步排查。

---

## 进度快照（2026-03-25）

### 功能状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 用户系统 | ✅ 完成 | 注册/登录/JWT认证/角色区分（老板/跑手） |
| 跑手管理 | ✅ 完成 | 资料编辑、头像、价格设置、手动在线/离线切换 |
| 在线状态 | ✅ 完成 | 半自动逻辑：ONLINE/OFFLINE 手动切换，BUSY 由订单自动计算 |
| 订单系统 | ✅ 完成 | 创建/接单/完成/评价 全流程 |
| 评价系统 | ✅ 完成 | 订单完成后可评价，带星级和评论 |
| 搜索筛选 | ✅ 完成 | 首页支持平台筛选和价格区间筛选 |

### 最近变更

1. **忘记密码功能**（2026-03-25）
   - 两步流程：输入手机号 → 验证码验证 → 重置密码
   - 6位数字验证码，5分钟有效
   - 开发环境验证码打印到控制台，并返回给前端（方便测试）
   - TODO: 需要配置短信服务（阿里云/腾讯云/Twilio）
   - 验证码存储在内存（生产环境建议使用 Redis）

2. **首页 SSR 优化**（2026-03-25）
   - 将首页改为服务端渲染，首次加载无闪烁
   - 筛选功能通过 URL query params 实现
   - 筛选栏作为客户端组件交互，数据服务端渲染
   - 支持 SEO，搜索引擎可抓取跑手列表

3. **登录记住我功能**（2026-03-25）
   - 登录页新增「记住我」复选框，默认勾选
   - 勾选：Token 有效期 30 天
   - 不勾选：Token 有效期 1 天
   - 记住用户名：下次登录自动填充手机号
   - 登录页 UI 改版，与其他页面风格统一

2. **订单超时自动完成机制**（2026-03-25）
   - ACCEPTED 状态订单超过 24 小时自动标记为 COMPLETED
   - Vercel Cron 每 5 分钟检查一次 (`*/5 * * * *`)
   - 自动更新跑手订单完成数
   - 用户订单页面显示超时倒计时（剩余 <4 小时显示红色警告）
   - 安全：支持 CRON_SECRET 环境变量验证

2. **价格筛选功能**（2026-03-25）
   - 首页新增平台筛选（全部/端游/手游）
   - 首页新增价格区间筛选（全部/¥10以下/¥10-15/¥15-20/¥20以上）
   - API 支持 `minPrice` 和 `maxPrice` 查询参数
   - 筛选结果实时更新，无结果时显示友好提示

### 最近变更

1. **P0 Bug 修复**（2026-03-25）
   - 修复订单状态显示不一致：检查后端查询逻辑与前端过滤条件
   - 增加上线/下线按钮：在个人中心资料编辑页添加状态切换功能
   - 修复身份体系割裂：允许同一手机号绑定多个角色（跑手+老板）
   - 新增 `/api/auth/bind-role` API 用于角色绑定

2. **订单页面 SSR 重构**（2026-03-25）
   - 问题：`/order/[id]` 使用静态数据，显示的是假跑手信息
   - 修复：改为服务端获取真实数据，从数据库读取跑手详情
   - 新增 API: `/api/runners/[id]` 获取单个跑手详情
   - 优化：支持头像显示，评分从实际评价计算

2. **trailingSlash 修复**（2026-03-25）
   - 问题：`trailingSlash: true` 导致 API 路由返回 404
   - 修复：改为 `trailingSlash: false`，统一所有链接格式

2. **在线状态逻辑重构**（2026-03-25）
   - 改为半自动模式：
     - `ONLINE` / `OFFLINE`：跑手手动切换（个人中心「我要上线/下线」按钮）
     - `BUSY`：自动计算，当有 ACCEPTED 订单时自动显示
   - 新增 `lib/runner-status.ts` 统一计算逻辑

3. **完整订单系统上线**（2026-03-25）
   - 老板端：下单流程（选择数量→预估价格→提交→查看联系方式）
   - 跑手端：订单管理（待接单→接单→进行中→标记完成）
   - 评价系统：完成后可评价，带星级和文字评论

### 已知问题

1. **头像上传**：仍使用 URL 输入，未实现本地上传（低优先级）
2. **短信服务**：忘记密码功能需要配置短信服务才能用于生产环境

### 下一步建议

1. 配置短信服务（阿里云/腾讯云/Twilio）用于生产环境
2. 添加订单支付/定金流程（如需变现）
3. 跑手端订单管理页面优化

---

*修改记录:*
- 2026-03-25 - P0 Bug 修复（订单状态、上线/下线按钮、身份体系临时补丁）
- 2026-03-25 - 忘记密码功能（短信验证码重置）
- 2026-03-25 - 首页 SSR 优化（无闪烁加载）
- 2026-03-25 - 登录记住我功能（30天/1天 Token 有效期）
- 2026-03-25 - 订单超时自动完成机制（ACCEPTED 24小时后自动完成）
- 2026-03-25 - 价格筛选功能完成（平台 + 价格区间）
- 2026-03-25 - 进度快照：订单系统完成，在线状态逻辑重构，trailingSlash 修复
- 2026-03-24 23:05 - 更新看板：SSR 和数据库已完成，新增域名访问问题排查
- 2026-03-24 22:05 - 重构看板，按 GPT-5.4 建议简化结构

---

## 进度快照（2026-03-25 20:40）

- **项目路径**: `C:\Users\admin\.openclaw\workspace\paodao-cloud`
- **部署地址**: https://paodao-cloud.vercel.app

### 已完成
- ✅ **抢单模式完整实现**: Redis分布式锁 + 并发保护 + 实时倒计时
- ✅ **抢单大厅页面**: `/public-orders` + 首页"⚡抢单大厅"入口按钮
- ✅ **数据库迁移**: OrderMode/PUBLIC模式 + claimDeadline字段已添加
- ✅ **API路由**: `GET /api/orders/public` + `PUT /api/orders/[id]/claim`
- ✅ **Redis锁实现**: `lib/redis-lock.ts`（内存fallback + Redis生产支持）
- ✅ **测试脚本**: `tests/test-claim-concurrency.js` 并发测试

### 未完成/待办
- **P0** 抢单功能最终验证（需人工并发测试确认）
- **P1** 配置生产环境 `REDIS_URL`（当前为内存fallback）
- **P2** 短信服务配置（忘记密码功能）
- **P2** 头像本地上传（S3/R2）

### 最近重要变更与修复
1. **抢单功能上线** - Redis分布式锁防止超卖，实时倒计时每秒刷新
2. **API请求头修复** - 添加 `Content-Type: application/json` 确保请求正常解析
3. **数据库迁移完成** - PUBLIC订单模式字段已全部添加

### 需要人工配合的最小清单
1. ✅ **Redis配置已完成**（已在Vercel Dashboard配置`REDIS_URL`）
2. ⏳ **并发测试验证** - 需登录两个跑手账号同时抢单验证仅一人成功
3. **短信服务** - 生产环境需配置 `SMS_API_KEY` 和 `SMS_PROVIDER`

### 下一步建议
1. **高优先级**: 完成抢单功能并发测试，确认Redis锁工作正常
2. **中优先级**: 配置短信服务用于生产环境忘记密码功能
3. **低优先级**: 头像本地上传功能（S3/R2接入）

---

## 进度快照 (2026-03-25 17:25)

### 本次变更
- **分支**: `feature/runner-order-detail-1742892700`, `feature/order-cancel-1742893200`
- **Commit**: `c61ad138` - feat: runner order detail page (#1)；`e7f31165` - feat: order cancel functionality (#2)
- **已合并到 main**: `667cc4c2` - Merge branch 'feature/order-cancel-1742893200'

### 完成任务
- ✅ **#1 跑手端订单详情页**: `/profile/orders/[id]` 新增详情页，支持查看客户信息、订单状态、进度、联系方式、操作按钮（接单/更新进度/完成）、订单轨迹
- ✅ **#2 订单取消功能**: `PUT /api/orders/[id]/cancel` API，仅 PENDING 状态可取消，支持老板或跑手取消，记录取消日志
- ✅ **#3 首页统计卡片点击**: StatsCards 组件支持点击筛选（全部/在线/忙碌），桌面端弹窗提示，移动端跳转
- ✅ **#4 抢单模式 scaffold**: public-orders 页面、抢单 API stub、Prisma schema 新增 OrderMode/PUBLIC 模式

### 关键文件
- `app/profile/orders/[id]/page.tsx` - 跑手订单详情页（新建）
- `app/api/orders/[id]/cancel/route.ts` - 取消订单 API（新建）
- `app/profile/orders/page.tsx` - 订单列表添加点击跳转链接
- `app/components/StatsCards.tsx` - 统计卡片点击交互
- `app/public-orders/page.tsx` - 抢单大厅占位页面

### 自测结果
- `npm run build` 成功（无 TypeScript 错误）
- `/profile/orders` 点击跳转详情页通过
- `/api/orders/[id]/cancel` API 权限校验通过（仅 PENDING 可取消）

### 尚待人工配合
- **数据库迁移**: 已执行 `prisma db push` 同步 schema（PUBLIC 模式字段已添加）
- **Redis 配置**: 抢单功能需要 `REDIS_URL` 环境变量（仅 #4 scaffold，未实际启用）
- **短信服务**: 忘记密码功能需要配置 `SMS_API_KEY` 和 `SMS_PROVIDER`（当前为开发模式）
