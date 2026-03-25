const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. 使用原始 SQL 查找可用订单
    const orders = await prisma.$queryRaw`
      SELECT id, status, mode, amount, "userId" 
      FROM "Order" 
      WHERE status = 'PENDING' 
      LIMIT 3
    `;
    
    console.log('可用订单:');
    console.log(JSON.stringify(orders, null, 2));
    
    if (orders.length === 0) {
      console.log('\n没有找到 PENDING 订单');
      process.exit(1);
    }
    
    // 2. 更新第一个订单为 PUBLIC 模式
    const orderId = orders[0].id;
    await prisma.$executeRaw`
      UPDATE "Order" 
      SET 
        mode = 'PUBLIC'::"OrderMode",
        "claimDeadline" = NOW() + INTERVAL '10 minutes',
        "runnerId" = NULL
      WHERE id = ${orderId}
    `;
    
    // 3. 查询更新后的订单
    const updated = await prisma.$queryRaw`
      SELECT id, amount, mode, status, "claimDeadline"
      FROM "Order"
      WHERE id = ${orderId}
    `;
    
    console.log('\n✅ 已更新订单为 PUBLIC 模式:');
    console.log(`订单 ID: ${orderId}`);
    console.log(`金额: ¥${updated[0].amount}`);
    console.log(`模式: ${updated[0].mode}`);
    console.log(`抢单截止: ${updated[0].claimDeadline}`);
    console.log('\n请在浏览器中获取跑手 token，然后运行:');
    console.log(`node tests/test-claim-concurrency.js ${orderId} <token1> <token2>`);
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
