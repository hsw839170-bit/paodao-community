# 项目看板（最后更新：2026-03-24 23:05）

> 每次打开项目先读这里！严格遵守注意事项，按 TODO/DOING 列表执行。

---

## 1. 注意事项

- **技术栈**: Next.js 14 App Router + Prisma + PostgreSQL
- **部署模式**: ✅ SSR 模式（已移除 `output: 'export'`），API 路由已启用
- **数据库**: ✅ Neon PostgreSQL 已连接
- **代码风格**: 函数组件 + TypeScript，表单用受控组件

---

## 2. 待办（TODO）

- [ ] **P2** 头像上传 - 从 URL 输入改为本地上传（S3/R2）
- [ ] **P2** 订单系统 - Order 表 + 下单/接单/完成流程
- [ ] **P2** 搜索筛选 - 跑手列表按平台/价格/在线状态筛选

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

*修改记录:*
- 2026-03-24 23:05 - 更新看板：SSR 和数据库已完成，新增域名访问问题排查
- 2026-03-24 22:05 - 重构看板，按 GPT-5.4 建议简化结构
