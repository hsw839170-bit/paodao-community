const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = process.argv[2] || '9eaa326c-a5b6-41ac-804f-172b8135390b';
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { runner: true }
  });
  
  if (!order) {
    console.log('订单不存在');
    return;
  }
  
  console.log('========================================');
  console.log('订单状态检查');
  console.log('========================================');
  console.log('订单ID:', order.id);
  console.log('状态:', order.status);
  console.log('模式:', order.mode);
  console.log('金额:', order.amount);
  console.log('跑手ID:', order.runnerId || '无');
  console.log('跑手昵称:', order.runner ? order.runner.nickname : '无');
  console.log('抢单时间:', order.claimedAt || '无');
  console.log('抢单截止:', order.claimDeadline);
  console.log('更新时间:', order.updatedAt);
  console.log('========================================');
  
  if (order.status === 'PENDING') {
    console.log('✅ 订单仍为 PENDING，等待抢单');
  } else if (order.status === 'ACCEPTED') {
    console.log('✅ 订单已被抢单');
    console.log('抢手足手:', order.runner?.nickname);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
