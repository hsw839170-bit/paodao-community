/**
 * 获取测试用跑手 Token
 * 
 * 如果没有跑手用户，自动创建一个
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // 查找或创建测试跑手用户
    let user = await prisma.user.findFirst({
      where: { phone: '18888888888' }
    });

    if (!user) {
      console.log('创建测试跑手用户...');
      const hashedPassword = await bcrypt.hash('Test123456', 10);
      
      user = await prisma.user.create({
        data: {
          phone: '18888888888',
          password: hashedPassword,
          role: 'RUNNER'
        }
      });
      
      // 创建跑手资料
      await prisma.runnerProfile.create({
        data: {
          userId: user.id,
          nickname: '并发测试跑手',
          phone: '18888888888',
          platform: 'PC',
          pricePer10M: 15,
          status: 'ONLINE'
        }
      });
      
      console.log('✅ 测试跑手用户已创建');
    } else {
      console.log('✅ 使用已有测试跑手用户');
      
      // 确保有跑手资料
      let profile = await prisma.runnerProfile.findUnique({
        where: { userId: user.id }
      });
      
      if (!profile) {
        await prisma.runnerProfile.create({
          data: {
            userId: user.id,
            nickname: '并发测试跑手',
            phone: '18888888888',
            platform: 'PC',
            pricePer10M: 15,
            status: 'ONLINE'
          }
        });
        console.log('✅ 创建跑手资料');
      } else {
        // 确保状态为 ONLINE
        await prisma.runnerProfile.update({
          where: { userId: user.id },
          data: { status: 'ONLINE' }
        });
        console.log('✅ 更新跑手状态为 ONLINE');
      }
    }

    // 生成 JWT Token
    const token = jwt.sign(
      { userId: user.id, role: 'RUNNER' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('');
    console.log('========================================');
    console.log('测试环境准备就绪');
    console.log('========================================');
    console.log(`用户ID: ${user.id}`);
    console.log(`手机号: ${user.phone}`);
    console.log('');
    console.log('JWT Token:');
    console.log(token);
    console.log('');
    console.log('环境变量设置命令（PowerShell）:');
    console.log(`$env:TOKEN="${token}"`);
    console.log(`$env:ORDER_ID="${process.env.ORDER_ID || '替换为实际订单ID'}"`);
    console.log('');
    console.log('运行并发测试:');
    console.log('node scripts/test-claim-concurrency.js');
    console.log('');
    
    // 保存到临时文件供后续使用
    const fs = require('fs');
    const testConfig = {
      userId: user.id,
      phone: user.phone,
      token,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync('.test-config.json', JSON.stringify(testConfig, null, 2));
    console.log('✅ 配置已保存到 .test-config.json');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
