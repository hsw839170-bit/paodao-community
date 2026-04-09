# 浏览器端抢单并发测试指南

## 快速验证步骤

### 方法：浏览器开发者工具测试

#### 步骤 1：准备测试环境
1. 打开浏览器，访问 https://paodao-cloud.vercel.app
2. 登录跑手账号（如果没有，先注册一个跑手账号）
3. 进入「抢单大厅」页面

#### 步骤 2：创建测试订单（老板身份）
1. 切换到老板身份（或新开一个浏览器窗口登录老板账号）
2. 点击「发布到抢单大厅」
3. 填写订单信息并发布
4. 记住生成的订单 ID（可以从浏览器地址栏或网络请求中看到）

#### 步骤 3：运行并发测试脚本
1. **切换回跑手身份**
2. 按 `F12` 打开开发者工具
3. 切换到 **Console（控制台）** 标签
4. 复制粘贴以下代码：

```javascript
(async function testClaim() {
  const token = localStorage.getItem('token');
  const orderId = '粘贴你的订单ID到这里';
  
  console.log('开始 10 次并发抢单测试...');
  
  const results = await Promise.all(
    Array.from({length: 10}, (_, i) => 
      fetch(`/api/orders/${orderId}/claim`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      }).then(r => ({ index: i+1, status: r.status, ok: r.ok })).catch(e => ({ index: i+1, status: 'ERR', ok: false }))
    )
  );
  
  results.forEach(r => console.log(`请求 ${r.index}: HTTP ${r.status} ${r.ok ? '✅' : '❌'}`));
  
  const success = results.filter(r => r.ok).length;
  const conflict = results.filter(r => r.status === 409).length;
  
  console.log(`\n结果: 成功 ${success} / 冲突 ${conflict}`);
  console.log(success === 1 && conflict === 9 ? '✅ 测试通过！锁正常工作' : '❌ 测试异常，请检查');
})();
```

5. 将 `'粘贴你的订单ID到这里'` 替换为实际的 PUBLIC 订单 ID
6. 按回车执行

#### 步骤 4：查看结果
预期输出：
```
请求 1: HTTP 200 ✅
请求 2: HTTP 409 ❌
请求 3: HTTP 409 ❌
...
请求 10: HTTP 409 ❌

结果: 成功 1 / 冲突 9
✅ 测试通过！锁正常工作
```

### 预期结果

| 状态 | 次数 | 说明 |
|------|------|------|
| HTTP 200 | 1 | 第一个抢到锁的请求成功 |
| HTTP 409 | 9 | 其他请求被正确拒绝（订单已被抢） |
| 其他 | 0 | 无 |

如果结果符合预期，说明 Redis 分布式锁在生产环境正常工作。

### 常见问题

**Q: 所有请求都返回 401**
- A: Token 已过期，请重新登录跑手账号

**Q: 所有请求都返回 404**
- A: 订单 ID 错误或订单不存在/已过期

**Q: 多个请求返回 200**
- A: 分布式锁失效，请检查 Vercel 的 REDIS_URL 配置

**Q: 请求超时**
- A: 可能是 Redis 连接问题，检查 Vercel Logs

---

## 完整测试脚本

使用 `scripts/browser-concurrency-test.js` 中的完整版本可以获得更详细的测试报告。
