const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 更新订单过期时间到 10 分钟后
  await prisma.$executeRaw`
    UPDATE "Order" 
    SET "claimDeadline" = NOW() + INTERVAL '10 minutes'
    WHERE id = 'f15b579d-e55c-47ff-93dd-edc13c826af9'
  `;
  
  // 重置订单状态（如果已被抢）
  await prisma.$executeRaw`
    UPDATE "Order" 
    SET status = 'PENDING', "runnerId" = NULL, "claimedAt" = NULL
    WHERE id = 'f15b579d-e55c-47ff-93dd-edc13c826af9'
  `;
  
  const order = await prisma.$queryRaw`
    SELECT id, status, mode, amount, "claimDeadline", "runnerId"
    FROM "Order"
    WHERE id = 'f15b579d-e55c-47ff-93dd-edc13c826af9'
  `;
  
  console.log('✅ 订单已更新:');
  console.log(`ID: ${order[0].id}`);
  console.log(`金额: ¥${order[0].amount}`);
  console.log(`状态: ${order[0].status}`);
  console.log(`截止: ${order[0].claimDeadline}`);
  console.log(`模式: ${order[0].mode}`);
  
  await prisma.$disconnect();
}

main();
