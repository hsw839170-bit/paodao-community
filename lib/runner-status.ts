import { prisma } from './prisma';

/**
 * 计算跑手的实际展示状态
 * 规则：
 * - 如果有进行中的订单（ACCEPTED），返回 BUSY
 * - 否则返回跑手手动设置的 status（ONLINE/OFFLINE）
 */
export async function computeRunnerStatus(runnerId: string): Promise<'ONLINE' | 'OFFLINE' | 'BUSY'> {
  // 查询跑手的基础状态
  const runner = await prisma.runnerProfile.findUnique({
    where: { id: runnerId },
    select: { status: true }
  });

  if (!runner) {
    return 'OFFLINE';
  }

  // 查询是否有进行中的订单
  const activeOrder = await prisma.order.findFirst({
    where: {
      runnerId: runnerId,
      status: 'ACCEPTED'
    }
  });

  // 如果有进行中的订单，返回 BUSY
  if (activeOrder) {
    return 'BUSY';
  }

  // 否则返回手动设置的状态（只能是 ONLINE 或 OFFLINE）
  return runner.status as 'ONLINE' | 'OFFLINE';
}

/**
 * 批量计算多个跑手的状态
 */
export async function computeRunnersStatus(runnerIds: string[]): Promise<Map<string, 'ONLINE' | 'OFFLINE' | 'BUSY'>> {
  const result = new Map<string, 'ONLINE' | 'OFFLINE' | 'BUSY'>();

  if (runnerIds.length === 0) {
    return result;
  }

  // 批量查询跑手基础状态
  const runners = await prisma.runnerProfile.findMany({
    where: { id: { in: runnerIds } },
    select: { id: true, status: true }
  });

  // 查询所有进行中的订单
  const activeOrders = await prisma.order.findMany({
    where: {
      runnerId: { in: runnerIds },
      status: 'ACCEPTED'
    },
    select: { runnerId: true }
  });

  // 构建有活跃订单的 runnerId Set
  const busyRunnerIds = new Set(activeOrders.map(o => o.runnerId));

  // 计算每个跑手的状态
  for (const runner of runners) {
    if (busyRunnerIds.has(runner.id)) {
      result.set(runner.id, 'BUSY');
    } else {
      result.set(runner.id, runner.status as 'ONLINE' | 'OFFLINE');
    }
  }

  return result;
}
