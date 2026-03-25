# 短信验证码服务配置

## 环境变量列表

### 基础开关
| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `FEATURE_SMS_VERIFY` | 是否启用短信验证功能 | `false` | 是 |
| `SMS_RATE_LIMIT_PER_MINUTE` | 每分钟发送限制 | `3` | 否 |
| `SMS_CODE_TTL_MS` | 验证码有效期（毫秒） | `300000` (5分钟) | 否 |

### 短信服务商配置（生产环境需配置）
| 变量名 | 说明 | 服务商 |
|--------|------|--------|
| `SMS_PROVIDER` | 短信服务商类型 | `aliyun` / `tencent` |

#### 阿里云短信
| 变量名 | 说明 |
|--------|------|
| `ALIYUN_ACCESS_KEY_ID` | AccessKey ID |
| `ALIYUN_ACCESS_KEY_SECRET` | AccessKey Secret |
| `ALIYUN_SMS_SIGN_NAME` | 短信签名 |
| `ALIYUN_SMS_TEMPLATE_CODE` | 验证码模板 CODE |

#### 腾讯云短信
| 变量名 | 说明 |
|--------|------|
| `TENCENT_SECRET_ID` | SecretId |
| `TENCENT_SECRET_KEY` | SecretKey |
| `TENCENT_SMS_SDK_APP_ID` | SDK App ID |
| `TENCENT_SMS_SIGN_NAME` | 短信签名 |
| `TENCENT_SMS_TEMPLATE_ID` | 模板 ID |

### 可选：Redis 配置（用于分布式环境）
| 变量名 | 说明 |
|--------|------|
| `REDIS_URL` | Redis 连接字符串 |

## 配置示例

### 开发环境 (.env.local)
```env
# 启用短信验证（开发模式）
FEATURE_SMS_VERIFY=true
SMS_RATE_LIMIT_PER_MINUTE=10
SMS_CODE_TTL_MS=300000
```

### 生产环境 (Vercel Dashboard)
```env
# 启用短信验证
FEATURE_SMS_VERIFY=true
SMS_RATE_LIMIT_PER_MINUTE=3
SMS_CODE_TTL_MS=300000

# 阿里云短信
SMS_PROVIDER=aliyun
ALIYUN_ACCESS_KEY_ID=your_access_key
ALIYUN_ACCESS_KEY_SECRET=your_secret
ALIYUN_SMS_SIGN_NAME=你的签名
ALIYUN_SMS_TEMPLATE_CODE=SMS_12345678
```

## 开发模式说明

当 `NODE_ENV=development` 且 `FEATURE_SMS_VERIFY=true` 时：
- 验证码会打印在服务器控制台
- API 响应会包含验证码（方便测试）
- 不会真正发送短信

## 生产环境接入步骤

1. **申请短信服务商账号**
   - 阿里云：https://www.aliyun.com/product/sms
   - 腾讯云：https://cloud.tencent.com/product/sms

2. **配置签名和模板**
   - 提交签名审核（如：DeltaRun）
   - 提交验证码模板审核

3. **获取凭证**
   - 阿里云：AccessKey ID / Secret
   - 腾讯云：SecretId / SecretKey

4. **在 Vercel 添加环境变量**
   - 进入 Project Settings → Environment Variables
   - 添加上述所有必需变量
   - 重新部署项目

5. **修改代码接入服务商**
   - 修改 `app/api/auth/send-code/route.ts`
   - 取消注释对应服务商的发送代码
   - 重新部署

## API 文档

### POST /api/auth/send-code
请求：
```json
{ "phone": "13800138000" }
```

响应（开发）：
```json
{
  "success": true,
  "message": "验证码已发送",
  "code": "123456",
  "remainingAttempts": 2
}
```

响应（生产）：
```json
{
  "success": true,
  "message": "验证码已发送",
  "remainingAttempts": 2
}
```

### POST /api/auth/verify-code
请求：
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

响应（已注册用户）：
```json
{
  "success": true,
  "action": "LOGIN",
  "token": "jwt_token",
  "user": { "id": "...", "phone": "...", "role": "RUNNER" }
}
```

响应（未注册用户）：
```json
{
  "success": true,
  "action": "REGISTER",
  "preRegisterToken": "jwt_token",
  "phone": "13800138000"
}
```
