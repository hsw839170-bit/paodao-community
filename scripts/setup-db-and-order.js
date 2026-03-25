const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('执行数据库迁移...\n');
    
    // 1. 创建 OrderMode enum
    try {
      await prisma.$executeRaw`CREATE TYPE "OrderMode" AS ENUM ('PRIVATE', 'PUBLIC')`;
      console.log('✅ 创建 OrderMode enum');
    } catch (e) {
      console.log('ℹ️ OrderMode enum 已存在');
    }
    
    // 2. 添加 mode 字段
    try {
      await prisma.$executeRaw`ALTER TABLE "Order" ADD COLUMN "mode" "OrderMode" NOT NULL DEFAULT 'PRIVATE'`;
      console.log('✅ 添加 mode 字段');
    } catch (e) {
      console.log('ℹ️ mode 字段已存在');
    }
    
    // 3. 添加 claimDeadline 字段
    try {
      await prisma.$executeRaw`ALTER TABLE "Order" ADD COLUMN "claimDeadline" TIMESTAMP(3)`;
      console.log('✅ 添加 claimDeadline 字段');
    } catch (e) {
      console.log('ℹ️ claimDeadline 字段已存在');
    }
    
    // 4. 添加 claimedAt 字段
    try {
      await prisma.$executeRaw`ALTER TABLE "Order" ADD COLUMN "claimedAt" TIMESTAMP(3)`;
      console.log('✅ 添加 claimedAt 字段');
    } catch (e) {
      console.log('ℹ️ claimedAt 字段已存在');
    }
    
    // 5. 修改 runnerId 为 nullable
    try {
      await prisma.$executeRaw`ALTER TABLE "Order" ALTER COLUMN "runnerId" DROP NOT NULL`;
      console.log('✅ runnerId 改为 nullable');
    } catch (e) {
      console.log('ℹ️ runnerId 已是 nullable');
    }
    
    // 6. 添加索引
    try {
      await prisma.$executeRaw`CREATE INDEX "Order_mode_idx" ON "Order"("mode")`;
      console.log('✅ 创建 Order_mode_idx 索引');
    } catch (e) {
      console.log('ℹ️ Order_mode_idx 索引已存在');
    }
    
    try {
      await prisma.$executeRaw`CREATE INDEX "Order_claimDeadline_idx" ON "Order"("claimDeadline")`;
      console.log('✅ 创建 Order_claimDeadline_idx 索引');
    } catch (e) {
      console.log('ℹ️ Order_claimDeadline_idx 索引已存在');
    }
    
    console.log('\n✅ 数据库迁移完成！');
    
    // 7. 查找并更新一个订单为 PUBLIC 模式
    const orders = await prisma.$queryRaw`SELECT id, status, amount FROM "Order" WHERE status = 'PENDING' LIMIT 1`;
    
    if (orders.length === 0) {
      console.log('\n⚠️ 没有找到 PENDING 订单，请先创建订单');
      process.exit(1);
    }
    
    const orderId = orders[0].id;
    await prisma.$executeRaw`
      UPDATE "Order" 
      SET mode = 'PUBLIC'::"OrderMode", 
          "claimDeadline" = NOW() + INTERVAL '10 minutes',
          "runnerId" = NULL
      WHERE id = ${orderId}
    `;
    
    console.log('\n📝 测试订单已创建:');
    console.log(`订单 ID: ${orderId}`);
    console.log(`金额: ¥${orders[0].amount}`);
    console.log(`抢单截止: 10分钟后`);
    console.log('\n下一步：获取跑手 token 并运行并发测试');
    console.log(`node tests/test-claim-concurrency.js ${orderId} <token1> <token2>`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
