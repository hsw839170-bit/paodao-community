/**
 * 并发抢单测试脚本
 * 
 * 功能：对同一个 PUBLIC 订单并发发起多次 claim 请求，验证分布式锁是否正常工作
 * 
 * 使用方式:
 * 1. 确保有 REDIS_URL 环境变量（或确认使用 memory fallback）
 * 2. 先运行 `node scripts/create-public-order.js` 创建一个测试订单
 * 3. 设置环境变量 ORDER_ID 和 TOKEN，然后运行本脚本
 * 
 * 环境变量:
 * - API_BASE: API 基础地址（默认: http://localhost:3000）
 * - ORDER_ID: 测试订单 ID（必填）
 * - TOKEN: 跑手 JWT Token（必填，至少一个有效跑手 token）
 * - CONCURRENCY: 并发数（默认: 10）
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const ORDER_ID = process.env.ORDER_ID;
const TOKEN = process.env.TOKEN;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);

if (!ORDER_ID) {
  console.error('❌ 错误: 请设置 ORDER_ID 环境变量');
  console.error('   示例: ORDER_ID=xxx node scripts/test-claim-concurrency.js');
  process.exit(1);
}

if (!TOKEN) {
  console.error('❌ 错误: 请设置 TOKEN 环境变量（跑手 JWT Token）');
  console.error('   示例: TOKEN=xxx node scripts/test-claim-concurrency.js');
  console.error('   提示: 可以通过浏览器登录跑手账号后从 localStorage 获取 token');
  process.exit(1);
}

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 抢单请求
async function claimOrder(index) {
  const startTime = Date.now();
  try {
    const res = await fetch(`${API_BASE}/api/orders/${ORDER_ID}/claim`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      // 解析失败，忽略
    }
    
    return {
      index: index + 1,
      status: res.status,
      success: res.ok,
      duration,
      message: data.message || data.error || '无响应体'
    };
  } catch (error) {
    return {
      index: index + 1,
      status: 'ERROR',
      success: false,
      duration: Date.now() - startTime,
      message: error.message
    };
  }
}

async function main() {
  console.log('========================================');
  console.log('并发抢单测试 - 分布式锁验证');
  console.log('========================================');
  console.log(`API 地址: ${API_BASE}`);
  console.log(`订单 ID: ${ORDER_ID}`);
  console.log(`并发数: ${CONCURRENCY}`);
  console.log('');
  
  // 检查 Redis 环境
  const hasRedis = !!process.env.REDIS_URL;
  console.log(`Redis 配置: ${hasRedis ? '✅ 已配置' : '⚠️ 未配置 (使用 memory fallback)'}`);
  console.log('');
  
  console.log('----------------------------------------');
  console.log(`开始并发抢单测试（${CONCURRENCY} 个请求同时）`);
  console.log('----------------------------------------');
  
  const startTime = Date.now();
  
  // 并发发起所有请求
  const promises = Array.from({ length: CONCURRENCY }, (_, i) => claimOrder(i));
  const results = await Promise.all(promises);
  
  const totalDuration = Date.now() - startTime;
  
  // 打印每个请求结果
  console.log('\n详细结果:');
  console.log('----------------------------------------');
  results.forEach(r => {
    const icon = r.success ? '✅' : r.status === 409 ? '🚫' : r.status === 429 ? '⏳' : '❌';
    console.log(`${icon} 请求 ${r.index}: HTTP ${r.status} (${r.duration}ms) - ${r.message}`);
  });
  
  // 统计
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
  console.log(`平均响应时间:      ${Math.round(totalDuration / CONCURRENCY)}ms`);
  console.log('');
  
  // 结论
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
    console.log('   - 建议检查订单状态后重新测试');
  } else if (successCount > 1) {
    console.log('❌ 测试失败！存在超卖风险');
    console.log(`   - ${successCount} 个请求同时成功，预期只有 1 个`);
    console.log('   - 分布式锁未正常工作');
    if (!hasRedis) {
      console.log('   - ⚠️ 当前使用 memory fallback，仅适用于单实例');
      console.log('   - 生产环境必须配置 REDIS_URL');
    } else {
      console.log('   - 请检查 Redis 连接和锁实现');
    }
  } else {
    console.log('⚠️ 测试结果异常，请检查配置');
  }
  
  console.log('');
}

main().catch(err => {
  console.error('❌ 脚本执行错误:', err.message);
  process.exit(1);
});
