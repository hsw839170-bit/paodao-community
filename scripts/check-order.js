const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.$queryRaw`
    SELECT id, status, mode, amount, "claimDeadline", "runnerId" 
    FROM "Order" 
    WHERE id = 'f15b579d-e55c-47ff-93dd-edc13c826af9'
  `;
  console.log('订单状态:', JSON.stringify(order[0], null, 2));
  
  // 重置订单状态以便测试
  if (order[0].runnerId || order[0].status !== 'PENDING') {
    console.log('\n⚠️ 订单已被抢，重置为可抢状态...');
    await prisma.$executeRaw`
      UPDATE "Order" 
      SET status = 'PENDING', "runnerId" = NULL, "claimedAt" = NULL
      WHERE id = 'f15b579d-e55c-47ff-93dd-edc13c826af9'
    `;
    console.log('✅ 订单已重置');
  }
  
  await prisma.$disconnect();
}

main();
