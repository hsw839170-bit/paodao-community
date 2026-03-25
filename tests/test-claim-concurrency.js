/**
 * 并发抢单测试脚本
 * 
 * 用法:
 * node tests/test-claim-concurrency.js <order_id> <runner_token_1> [<runner_token_2> ...]
 * 
 * 示例:
 * node tests/test-claim-concurrency.js abc-123 eyJhbG... eyJhbG... eyJhbG...
 * 
 * 预期结果:
 * - 仅 1 个请求返回 200（成功抢单）
 * - 其余请求返回 409（已被抢）或 429（锁冲突）
 * 
 * 环境要求:
 * - 生产环境必须配置 REDIS_URL，否则 Serverless 下内存锁无效
 * - 开发环境可使用内存 fallback（仅单实例有效）
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function claimOrder(orderId, token, index) {
  const startTime = Date.now();
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/claim`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const duration = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));
    
    return {
      index,
      status: res.status,
      success: res.ok,
      duration,
      message: data.message || data.error || 'unknown',
    };
  } catch (error) {
    return {
      index,
      status: 'ERROR',
      success: false,
      duration: Date.now() - startTime,
      message: error.message,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node test-claim-concurrency.js <order_id> <token1> [<token2> ...]');
    console.log('示例: node test-claim-concurrency.js abc-123 eyJhbG... eyJhbG...');
    process.exit(1);
  }
  
  const orderId = args[0];
  const tokens = args.slice(1);
  
  console.log('========================================');
  console.log('并发抢单测试');
  console.log('========================================');
  console.log(`订单 ID: ${orderId}`);
  console.log(`并发数: ${tokens.length}`);
  console.log(`API 地址: ${API_BASE}`);
  console.log(`Redis URL: ${process.env.REDIS_URL ? '已配置 ✅' : '未配置 ⚠️ (使用内存 fallback)'}`);
  console.log('');
  
  if (!process.env.REDIS_URL) {
    console.log('⚠️ 警告: 未配置 REDIS_URL');
    console.log('   - 本地测试: 内存锁在单实例下有效');
    console.log('   - Vercel 生产环境: 必须使用 Redis，否则可能超卖');
    console.log('');
  }
  
  console.log('开始并发请求...\n');
  
  // 同时发起所有请求
  const startTime = Date.now();
  const results = await Promise.all(
    tokens.map((token, index) => claimOrder(orderId, token, index))
  );
  const totalDuration = Date.now() - startTime;
  
  // 统计结果
  const successCount = results.filter(r => r.success).length;
  const conflictCount = results.filter(r => r.status === 409).length;
  const lockedCount = results.filter(r => r.status === 429).length;
  const errorCount = results.filter(r => !r.success && r.status !== 409 && r.status !== 429).length;
  
  // 打印详细结果
  console.log('----------------------------------------');
  console.log('详细结果');
  console.log('----------------------------------------');
  results.forEach(r => {
    const icon = r.success ? '✅' : r.status === 409 || r.status === 429 ? '🚫' : '❌';
    console.log(`${icon} 请求 #${r.index + 1}: ${r.status} (${r.duration}ms) - ${r.message}`);
  });
  
  console.log('\n----------------------------------------');
  console.log('统计');
  console.log('----------------------------------------');
  console.log(`总请求数: ${tokens.length}`);
  console.log(`成功抢单: ${successCount} (预期: 1)`);
  console.log(`已被抢走: ${conflictCount}`);
  console.log(`锁冲突: ${lockedCount}`);
  console.log(`其他错误: ${errorCount}`);
  console.log(`总耗时: ${totalDuration}ms`);
  console.log('');
  
  // 验证结果
  if (successCount === 1) {
    console.log('✅ 测试通过: 仅一个请求成功，并发锁工作正常');
  } else if (successCount === 0) {
    console.log('❌ 测试失败: 没有请求成功，可能订单已被抢或已过期');
  } else {
    console.log('❌ 测试失败: 多个请求成功，存在超卖！');
    console.log('   生产环境请确保已配置 REDIS_URL');
  }
  
  console.log('');
}

main().catch(console.error);
