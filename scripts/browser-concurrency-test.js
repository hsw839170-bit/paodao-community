/**
 * 浏览器端并发抢单测试脚本
 * 
 * 使用方法：
 * 1. 登录跑手账号，打开抢单大厅页面
 * 2. 打开浏览器开发者工具（F12）
 * 3. 切换到 Console 标签
 * 4. 复制粘贴此脚本并回车执行
 * 5. 查看测试结果
 */

(async function testClaimConcurrency() {
  // 从 localStorage 获取 token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ 未找到 token，请先登录跑手账号');
    return;
  }

  // 获取当前页面中的 PUBLIC 订单 ID
  // 注意：你需要先找到订单 ID，可以从页面元素或网络请求中获取
  const orderId = prompt('请输入要测试的 PUBLIC 订单 ID:', '');
  if (!orderId) {
    console.error('❌ 未提供订单 ID');
    return;
  }

  const API_BASE = window.location.origin;
  const CONCURRENCY = 10;

  console.log('========================================');
  console.log('浏览器端并发抢单测试');
  console.log('========================================');
  console.log('API:', API_BASE);
  console.log('订单ID:', orderId);
  console.log('并发数:', CONCURRENCY);
  console.log('');

  // 抢单请求函数
  async function claimOrder(index) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/claim`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const duration = Math.round(performance.now() - startTime);
      const data = await response.json().catch(() => ({}));
      
      return {
        index: index + 1,
        status: response.status,
        success: response.ok,
        duration,
        message: data.message || data.error || '无响应'
      };
    } catch (error) {
      return {
        index: index + 1,
        status: 'ERROR',
        success: false,
        duration: Math.round(performance.now() - startTime),
        message: error.message
      };
    }
  }

  console.log('开始并发抢单测试...');
  console.log('----------------------------------------');

  // 并发发起所有请求
  const startTime = performance.now();
  const promises = Array.from({ length: CONCURRENCY }, (_, i) => claimOrder(i));
  const results = await Promise.all(promises);
  const totalDuration = Math.round(performance.now() - startTime);

  // 打印详细结果
  results.forEach(r => {
    const icon = r.success ? '✅' : r.status === 409 ? '🚫' : r.status === 429 ? '⏳' : '❌';
    console.log(`${icon} 请求 ${r.index}: HTTP ${r.status} (${r.duration}ms) - ${r.message}`);
  });

  // 统计
  const successCount = results.filter(r => r.success).length;
  const conflictCount = results.filter(r => r.status === 409).length;
  const rateLimitCount = results.filter(r => r.status === 429).length;
  const otherCount = results.filter(r => !r.success && r.status !== 409 && r.status !== 429).length;

  console.log('');
  console.log('========================================');
  console.log('测试结果统计');
  console.log('========================================');
  console.log(`✅ 成功 (200):      ${successCount} 次`);
  console.log(`🚫 冲突 (409):      ${conflictCount} 次`);
  console.log(`⏳ 限流 (429):      ${rateLimitCount} 次`);
  console.log(`❌ 其他错误:        ${otherCount} 次`);
  console.log(`----------------------------------------`);
  console.log(`总请求数:          ${CONCURRENCY} 次`);
  console.log(`总耗时:            ${totalDuration}ms`);
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
    console.log('   - 可能 TOKEN 无效或已过期');
  } else if (successCount > 1) {
    console.log('❌ 测试失败！存在超卖风险');
    console.log(`   - ${successCount} 个请求同时成功，预期只有 1 个`);
    console.log('   - 分布式锁未正常工作');
  } else {
    console.log('⚠️ 测试结果异常，请检查配置');
    console.log(`   - 成功: ${successCount}, 冲突: ${conflictCount}`);
  }

  // 返回结果供进一步处理
  return { successCount, conflictCount, results };
})();
