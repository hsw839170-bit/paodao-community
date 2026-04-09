/**
 * 并发抢单测试 - HTTP 版本
 * 使用 Node.js http 模块，兼容性更好
 */

const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const ORDER_ID = process.env.ORDER_ID || '9eaa326c-a5b6-41ac-804f-172b8135390b';
const TOKEN = process.env.TOKEN || '';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);

if (!TOKEN) {
  console.error('❌ 请设置 TOKEN 环境变量');
  process.exit(1);
}

// 解析 URL
const url = new URL(API_BASE);

// 抢单请求
function claimOrder(index) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: `/api/orders/${ORDER_ID}/claim`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let message = '无响应体';
        try {
          const json = JSON.parse(data);
          message = json.message || json.error || '无响应体';
        } catch(e) {}
        resolve({
          index: index + 1,
          status: res.statusCode,
          success: res.statusCode === 200,
          duration,
          message
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        index: index + 1,
        status: 'ERROR',
        success: false,
        duration: Date.now() - startTime,
        message: err.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        index: index + 1,
        status: 'TIMEOUT',
        success: false,
        duration: Date.now() - startTime,
        message: '请求超时'
      });
    });
    
    req.end();
  });
}

async function main() {
  console.log('========================================');
  console.log('并发抢单测试 - 分布式锁验证 (HTTP)');
  console.log('========================================');
  console.log(`API 地址: ${API_BASE}`);
  console.log(`订单 ID: ${ORDER_ID}`);
  console.log(`并发数: ${CONCURRENCY}`);
  console.log('');
  
  const hasRedis = !!process.env.REDIS_URL;
  console.log(`Redis 配置: ${hasRedis ? '✅ 已配置' : '⚠️ 未配置 (使用 memory fallback)'}`);
  console.log('');
  
  console.log('----------------------------------------');
  console.log(`开始并发抢单测试（${CONCURRENCY} 个请求同时）`);
  console.log('----------------------------------------');
  
  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENCY }, (_, i) => claimOrder(i));
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;
  
  console.log('\n详细结果:');
  console.log('----------------------------------------');
  results.forEach(r => {
    const icon = r.success ? '✅' : r.status === 409 ? '🚫' : r.status === 429 ? '⏳' : '❌';
    console.log(`${icon} 请求 ${r.index}: HTTP ${r.status} (${r.duration}ms) - ${r.message}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const conflictCount = results.filter(r => r.status === 409).length;
  const rateLimitCount = results.filter(r => r.status === 429).length;
  const errorCount = results.filter(r => !r.success && r.status !== 409 && r.status !== 429).length;
  
  console.log('\n========================================');
  console.log('测试结果统计');
  console.log('========================================');
  console.log(`✅ 成功 (200):      ${successCount} 次`);
  console.log(`🚫 冲突 (409):      ${conflictCount} 次`);
  console.log(`⏳ 限流 (429):      ${rateLimitCount} 次`);
  console.log(`❌ 其他错误:        ${errorCount} 次`);
  console.log(`----------------------------------------`);
  console.log(`总请求数:          ${CONCURRENCY} 次`);
  console.log(`总耗时:            ${totalDuration}ms`);
  console.log('');
  
  console.log('========================================');
  console.log('测试结论');
  console.log('========================================');
  
  if (successCount === 1 && conflictCount === CONCURRENCY - 1) {
    console.log('✅ 测试通过！分布式锁工作正常');
    console.log('   - 仅有一个请求成功抢单');
    console.log('   - 其余请求正确返回冲突 (409)');
    console.log('   - 无超卖现象');
  } else if (successCount === 0) {
    console.log('⚠️ 测试异常：没有请求成功');
    console.log('   - 可能订单已被抢或已过期');
    console.log('   - 可能 TOKEN 无效');
  } else if (successCount > 1) {
    console.log('❌ 测试失败！存在超卖风险');
    console.log(`   - ${successCount} 个请求同时成功，预期只有 1 个`);
    if (!hasRedis) {
      console.log('   - ⚠️ 当前使用 memory fallback，仅适用于单实例');
      console.log('   - 生产环境必须配置 REDIS_URL');
    }
  } else {
    console.log('⚠️ 测试结果异常，请检查配置');
  }
  
  console.log('');
}

main().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
