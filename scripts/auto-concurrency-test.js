/**
 * 自动创建测试跑手账号并执行并发抢单测试
 */

const API_BASE = 'https://paodao-cloud.vercel.app';
const ORDER_ID = 'f15b579d-e55c-47ff-93dd-edc13c826af9';

// 生成随机手机号
function randomPhone() {
  return '1' + ['3','4','5','7','8'][Math.floor(Math.random() * 5)] + 
    String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
}

// 注册并获取 token
async function registerAndGetToken(index) {
  const phone = randomPhone();
  const password = 'Test123456';
  
  console.log(`\n🏃 创建跑手 ${index + 1}: ${phone}`);
  
  try {
    // 1. 注册
    const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        password,
        role: 'RUNNER'
      })
    });
    
    const registerData = await registerRes.json();
    
    if (!registerRes.ok && registerData.error !== '手机号已注册') {
      console.log(`❌ 注册失败: ${registerData.error}`);
      return null;
    }
    
    if (registerData.token) {
      console.log(`✅ 注册成功，已获取 token`);
      return registerData.token;
    }
    
    // 2. 如果已注册，直接登录
    console.log(`ℹ️ 手机号已存在，尝试登录...`);
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginRes.ok) {
      console.log(`❌ 登录失败: ${loginData.error}`);
      return null;
    }
    
    console.log(`✅ 登录成功，已获取 token`);
    return loginData.token;
    
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`);
    return null;
  }
}

// 创建跑手资料
async function createRunnerProfile(token, index) {
  try {
    const res = await fetch(`${API_BASE}/api/runners/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: `测试跑手${index + 1}`,
        phone: randomPhone(),
        platform: 'PC',
        pricePer10M: 15,
        bio: '自动创建的测试账号'
      })
    });
    
    if (res.ok) {
      console.log(`✅ 跑手资料创建成功`);
    }
  } catch (e) {
    // 忽略错误，可能已有资料
  }
}

// 抢单
async function claimOrder(token, index) {
  const startTime = Date.now();
  try {
    const res = await fetch(`${API_BASE}/api/orders/${ORDER_ID}/claim`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));
    
    return {
      index: index + 1,
      status: res.status,
      success: res.ok,
      duration,
      message: data.message || data.error || 'unknown'
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
  console.log('并发抢单测试 - 自动创建跑手账号');
  console.log('========================================');
  console.log(`订单 ID: ${ORDER_ID}`);
  console.log(`API: ${API_BASE}`);
  console.log('');
  
  // 1. 创建两个跑手账号
  console.log('创建测试账号...');
  const token1 = await registerAndGetToken(0);
  const token2 = await registerAndGetToken(1);
  
  if (!token1 || !token2) {
    console.log('\n❌ 无法创建测试账号');
    process.exit(1);
  }
  
  // 2. 创建跑手资料
  await createRunnerProfile(token1, 0);
  await createRunnerProfile(token2, 1);
  
  console.log('\n----------------------------------------');
  console.log('开始并发抢单测试（2个请求同时）');
  console.log('----------------------------------------');
  
  // 3. 同时发起两个抢单请求
  const startTime = Date.now();
  const results = await Promise.all([
    claimOrder(token1, 0),
    claimOrder(token2, 1)
  ]);
  const totalDuration = Date.now() - startTime;
  
  // 4. 打印结果
  console.log('\n----------------------------------------');
  console.log('结果');
  console.log('----------------------------------------');
  
  results.forEach(r => {
    const icon = r.success ? '✅' : r.status === 409 || r.status === 429 ? '🚫' : '❌';
    console.log(`${icon} 跑手 ${r.index}: ${r.status} (${r.duration}ms) - ${r.message}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  
  console.log('\n----------------------------------------');
  console.log('统计');
  console.log('----------------------------------------');
  console.log(`成功抢单: ${successCount} (预期: 1)`);
  console.log(`总耗时: ${totalDuration}ms`);
  console.log('');
  
  if (successCount === 1) {
    console.log('✅ 测试通过！Redis 锁工作正常，仅一个跑手抢单成功');
  } else if (successCount === 0) {
    console.log('⚠️ 没有请求成功，可能订单已被抢或已过期');
  } else {
    console.log('❌ 测试失败！多个请求成功，存在超卖');
    console.log('   请检查 REDIS_URL 是否正确配置');
  }
  
  console.log('');
}

main().catch(console.error);
