const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. 更新所有 PUBLIC 订单的过期时间（延长30分钟）
  await prisma.$executeRaw`
    UPDATE "Order" 
    SET "claimDeadline" = NOW() + INTERVAL '30 minutes',
        status = 'PENDING',
        "runnerId" = NULL,
        "claimedAt" = NULL
    WHERE mode = 'PUBLIC'::"OrderMode"
  `;
  
  console.log('✅ 所有 PUBLIC 订单已重置（延长30分钟）');
  
  // 2. 查询最新的订单
  const orders = await prisma.$queryRaw`
    SELECT id, amount, status, "claimDeadline", "gameAmount", note
    FROM "Order"
    WHERE mode = 'PUBLIC'::"OrderMode"
    ORDER BY "createdAt" DESC
    LIMIT 2
  `;
  
  orders.forEach((o, i) => {
    console.log(`\n订单 ${i + 1}:`);
    console.log(`  ID: ${o.id}`);
    console.log(`  金额: ¥${o.amount}`);
    console.log(`  游戏币: ${o.gameAmount}万`);
    console.log(`  截止: ${o.claimDeadline}`);
  });
  
  await prisma.$disconnect();
}

main();
