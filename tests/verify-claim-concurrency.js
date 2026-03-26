/**
 * 自动化并发抢单验证脚本
 * 
 * 完整流程：
 * 1. 注册/登录老板账号，创建 PUBLIC 订单
 * 2. 注册/登录 3 个跑手账号
 * 3. 并发抢单测试
 * 
 * 用法: node tests/verify-claim-concurrency.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// 测试账号（使用随机数避免冲突）
const rand = Math.floor(Math.random() * 9000) + 1000;
const TEST_ACCOUNTS = {
  boss: { phone: `139${rand}0001`, password: 'Test123456', role: 'BOSS' },
  runners: [
    { phone: `139${rand}0002`, password: 'Test123456', role: 'RUNNER', nickname: '跑手A' },
    { phone: `139${rand}0003`, password: 'Test123456', role: 'RUNNER', nickname: '跑手B' },
    { phone: `139${rand}0004`, password: 'Test123456', role: 'RUNNER', nickname: '跑手C' },
  ]
};

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function registerOrLogin(account) {
  // 先尝试登录
  let res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      phone: account.phone,
      password: account.password,
    }),
  });
  
  if (res.ok) {
    console.log(`  ✅ ${account.phone} 登录成功`);
    return res.data.token;
  }
  
  // 登录失败，尝试注册
  console.log(`  📝 ${account.phone} 注册新账号...`);
  
  const registerBody = {
    phone: account.phone,
    password: account.password,
    role: account.role,
    nickname: account.nickname || account.phone,
  };
  
  // 跑手需要额外字段
  if (account.role === 'RUNNER') {
    registerBody.contactPhone = account.phone;
    registerBody.platform = 'BOTH';
    registerBody.pricePer10M = 50;  // 每千万游戏币价格
  }
  
  res = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(registerBody),
  });
  
  if (!res.ok) {
    throw new Error(`注册失败: ${res.data.error}`);
  }
  
  console.log(`  ✅ ${account.phone} 注册成功`);
  return res.data.token;
}

async function setupRunnerProfile(token, nickname) {
  // 更新跑手资料（确保可以接单）
  await api('/api/runners/update', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      nickname,
      platform: 'BOTH',
      pricePerMillion: 50,
      status: 'ONLINE',
    }),
  });
}

async function createPublicOrder(token) {
  const res = await api('/api/orders/public', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      title: '并发测试订单',
      description: '用于测试并发抢单机制',
      amount: 100,
      gameAmount: 1000,
      platform: 'BOTH',
      claimDeadline: new Date(Date.now() + 3600000).toISOString(), // 1小时后过期
    }),
  });
  
  if (!res.ok) {
    throw new Error(`创建订单失败: ${res.data.error}`);
  }
  
  return res.data.order.id;
}

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
      runnerId: data.order?.runnerId,
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
  console.log('========================================');
  console.log('并发抢单机制验证');
  console.log('========================================\n');
  
  console.log('Redis 状态:', process.env.REDIS_URL ? '已配置 ✅' : '未配置 ⚠️ (内存 fallback)');
  console.log('API 地址:', API_BASE);
  console.log('');
  
  try {
    // Step 1: 准备跑手账号
    console.log('【步骤 1】准备跑手账号...');
    const runnerTokens = [];
    for (const runner of TEST_ACCOUNTS.runners) {
      const token = await registerOrLogin(runner);
      await setupRunnerProfile(token, runner.nickname);
      runnerTokens.push(token);
    }
    console.log('');
    
    // Step 2: 准备老板账号并创建订单
    console.log('【步骤 2】创建 PUBLIC 测试订单...');
    const bossToken = await registerOrLogin(TEST_ACCOUNTS.boss);
    const orderId = await createPublicOrder(bossToken);
    console.log(`  ✅ 订单创建成功: ${orderId}\n`);
    
    // Step 3: 并发抢单测试
    console.log('【步骤 3】并发抢单测试（3 个跑手同时抢单）...');
    console.log('  发起并发请求...\n');
    
    const startTime = Date.now();
    const results = await Promise.all(
      runnerTokens.map((token, index) => claimOrder(orderId, token, index))
    );
    const totalDuration = Date.now() - startTime;
    
    // Step 4: 验证结果
    console.log('----------------------------------------');
    console.log('详细结果');
    console.log('----------------------------------------');
    
    results.forEach((r, i) => {
      const icon = r.success ? '✅' : r.status === 409 || r.status === 429 ? '🚫' : '❌';
      const runnerName = TEST_ACCOUNTS.runners[i].nickname;
      console.log(`${icon} ${runnerName}: HTTP ${r.status} (${r.duration}ms)`);
      console.log(`   消息: ${r.message}`);
      if (r.runnerId) {
        console.log(`   接单跑手ID: ${r.runnerId}`);
      }
    });
    
    const successCount = results.filter(r => r.success).length;
    const conflictCount = results.filter(r => r.status === 409).length;
    const lockedCount = results.filter(r => r.status === 429).length;
    
    console.log('\n----------------------------------------');
    console.log('统计');
    console.log('----------------------------------------');
    console.log(`总请求数: ${runnerTokens.length}`);
    console.log(`成功抢单: ${successCount}`);
    console.log(`已被抢走 (409): ${conflictCount}`);
    console.log(`锁冲突 (429): ${lockedCount}`);
    console.log(`总耗时: ${totalDuration}ms`);
    console.log('');
    
    // 最终验证
    console.log('----------------------------------------');
    console.log('验证结论');
    console.log('----------------------------------------');
    
    if (successCount === 1) {
      console.log('✅ 测试通过：仅有一个跑手成功抢单');
      console.log('✅ Redis 分布式锁 + 数据库乐观锁 工作正常');
      console.log('✅ 无超卖现象');
    } else if (successCount === 0) {
      console.log('❌ 测试异常：没有跑手成功抢单');
      console.log('   可能原因：订单创建失败或已过期');
    } else {
      console.log('❌ 测试失败：多个跑手同时抢单成功！');
      console.log('   存在超卖风险！');
      console.log('   生产环境务必配置 REDIS_URL');
    }
    
    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

main();
