/**
 * 检查并重置订单状态（用于测试）
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORDER_ID = process.argv[2];

async function main() {
  if (!ORDER_ID) {
    console.error('用法: node scripts/reset-order-status.js <订单ID>');
    process.exit(1);
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: ORDER_ID },
      include: {
        runner: true,
        user: true
      }
    });

    if (!order) {
      console.error('❌ 订单不存在');
      process.exit(1);
    }

    console.log('========================================');
    console.log('订单当前状态');
    console.log('========================================');
    console.log(`ID: ${order.id}`);
    console.log(`状态: ${order.status}`);
    console.log(`模式: ${order.mode}`);
    console.log(`跑手ID: ${order.runnerId || '无'}`);
    console.log(`金额: ¥${order.amount}`);
    console.log(`抢单截止: ${order.claimDeadline}`);
    console.log('');

    // 如果订单不是 PENDING，重置它
    if (order.status !== 'PENDING' || order.runnerId) {
      console.log('重置订单为 PENDING 状态...');
      
      await prisma.order.update({
        where: { id: ORDER_ID },
        data: {
          status: 'PENDING',
          runnerId: null,
          claimedAt: null,
          claimDeadline: new Date(Date.now() + 30 * 60 * 1000) // 30分钟后过期
        }
      });
      
      // 删除相关日志
      await prisma.orderLog.deleteMany({
        where: { orderId: ORDER_ID }
      });
      
      console.log('✅ 订单已重置为 PENDING 状态');
    } else {
      console.log('✅ 订单已经是 PENDING 状态，无需重置');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
