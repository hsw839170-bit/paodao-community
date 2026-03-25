const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 查找一个老板用户（用于创建订单）
    const bossUsers = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE role = 'BOSS' LIMIT 1
    `;
    
    let bossId;
    if (bossUsers.length === 0) {
      // 如果没有老板用户，创建一个
      const newUser = await prisma.$queryRaw`
        INSERT INTO "User" (id, phone, password, role, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '19999999999', '$2a$10$FakeHashForTest', 'BOSS', NOW(), NOW())
        RETURNING id
      `;
      bossId = newUser[0].id;
      console.log('创建测试老板用户');
    } else {
      bossId = bossUsers[0].id;
    }
    
    // 查找一个跑手用于初始 runnerId（后面会清空）
    const runners = await prisma.$queryRaw`
      SELECT id FROM "RunnerProfile" LIMIT 1
    `;
    
    if (runners.length === 0) {
      console.log('没有找到跑手，请先创建跑手');
      process.exit(1);
    }
    
    const runnerId = runners[0].id;
    
    // 创建新的 PUBLIC 订单
    const newOrder = await prisma.$queryRaw`
      INSERT INTO "Order" (
        id, "userId", "runnerId", mode, status, amount, "gameAmount", 
        note, progress, "claimDeadline", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${bossId},
        NULL,
        'PUBLIC'::"OrderMode",
        'PENDING',
        888,
        100,
        '新抢单订单 - 手快有手慢无！',
        0,
        NOW() + INTERVAL '30 minutes',
        NOW(),
        NOW()
      )
      RETURNING id, amount, "claimDeadline", "gameAmount", note
    `;
    
    console.log('✅ 新抢单订单已创建！');
    console.log('');
    console.log('订单信息：');
    console.log(`ID: ${newOrder[0].id}`);
    console.log(`金额: ¥${newOrder[0].amount}`);
    console.log(`游戏币: ${newOrder[0].gameAmount}万`);
    console.log(`备注: ${newOrder[0].note}`);
    console.log(`抢单截止: ${newOrder[0].claimDeadline}`);
    console.log('');
    console.log('抢单大厅链接：');
    console.log('https://paodao-cloud.vercel.app/public-orders');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
