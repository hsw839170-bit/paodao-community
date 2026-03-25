const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.$queryRaw`
    SELECT o.id, o.status, o.amount, o."runnerId", o.mode, o."claimedAt",
           r.nickname as runner_name, u.phone as runner_phone
    FROM "Order" o
    LEFT JOIN "RunnerProfile" r ON o."runnerId" = r.id
    LEFT JOIN "User" u ON r."userId" = u.id
    WHERE o.mode = 'PUBLIC'
    ORDER BY o."createdAt" DESC
    LIMIT 2
  `;
  
  console.log('PUBLIC 订单状态：');
  orders.forEach((o, i) => {
    console.log(`\n订单 ${i + 1}:`);
    console.log(`  ID: ${o.id}`);
    console.log(`  金额: ¥${o.amount}`);
    console.log(`  状态: ${o.status}`);
    console.log(`  抢单跑手: ${o.runner_name || '无'} (${o.runner_phone || 'N/A'})`);
    console.log(`  抢单时间: ${o.claimedAt || '未抢'}`);
  });
  
  await prisma.$disconnect();
}

main();
