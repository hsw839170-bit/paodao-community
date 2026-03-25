
---

## 进度快照（2026-03-25 14:50）

**项目路径与部署**  
- 本地：`C:\Users\admin\.openclaw\workspace\paodao-cloud`  
- 部署：https://paodao-cloud.vercel.app（主域名异常，预览地址正常）

**当前分支状态**  
- main：最新 commit `ef748636`（三个PR已合并）
- 已合并 feature 分支：
  - `feature/price-filter-20260325` - 自由输入价格筛选
  - `feature/wechat-contact-20260325` - 微信号联系方式
  - `feature/sms-verification-20260325` - 短信验证码骨架

**已完成核心功能**  
用户注册/登录、跑手资料管理、订单全流程（创建/接单/完成/评价）、在线状态切换、价格筛选、微信号、角色绑定系统。

**未完成 TODO**  
- P2：头像本地上传（S3/R2）
- P2：短信服务生产接入（需配置阿里云/腾讯云密钥）

**重要 Env 配置**（Vercel Dashboard 需设置）  
`JWT_SECRET`（必填）、`DATABASE_URL`（Neon PostgreSQL）、`FEATURE_SMS_VERIFY`（默认 false，设为 true 启用短信验证）

**最近重要变更**  
1. 价格筛选改为自由输入 min/max
2. 跑手资料新增微信号字段（数据库已迁移）
3. 短信验证码系统（开发模式可用，生产需配短信服务商）
4. JWT_SECRET 移除硬编码回退值

**已知问题**  
- 主域名 `paodao-cloud.vercel.app` 偶发连接关闭（预览地址正常）

**下一步推荐**  
1. 在 Vercel 设置 `FEATURE_SMS_VERIFY=true` 并配置短信服务商密钥  
2. 申请并绑定自定义域名（替代 vercel.app 子域名）  
3. 实现头像本地上传（Cloudflare R2 或 AWS S3）
