import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getLeaderboardData() {
  const runners = await prisma.runnerProfile.findMany({
    select: {
      id: true,
      nickname: true,
      platform: true,
      rating: true,
      ordersCount: true,
    },
    orderBy: {
      ordersCount: 'desc'
    },
    take: 10
  })

  // 计算收入（简化：假设每单平均50元）
  const withIncome = runners.map(r => ({
    ...r,
    income: r.ordersCount * 50
  }))

  return {
    byIncome: [...withIncome].sort((a, b) => b.income - a.income),
    byOrders: [...withIncome].sort((a, b) => b.ordersCount - a.ordersCount),
    byRating: [...withIncome]
      .filter(r => r.ordersCount >= 10)
      .sort((a, b) => b.rating - a.rating)
  }
}

export default async function LeaderboardPage() {
  const { byIncome, byOrders, byRating } = await getLeaderboardData()

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-block">← 返回首页</Link>

        <h1 className="text-3xl font-bold mb-8">排行榜</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-purple-400">💰 收入榜</h2>
            <div className="space-y-3">
              {byIncome.map((runner, index) => (
                <Link key={runner.id} href={`/runner/${runner.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition">
                    <span className={`w-6 text-center font-bold ${index < 3 ? 'text-yellow-400' : 'text-slate-400'}`}>{index + 1}</span>
                    <div className="flex-1">
                      <div className="font-medium">{runner.nickname}</div>
                      <div className="text-xs text-slate-400">{runner.platform === 'PC' ? '端游' : runner.platform === 'MOBILE' ? '手游' : '两者都可'}</div>
                    </div>
                    <div className="text-purple-400 font-bold">¥{runner.income}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-400">📦 订单榜</h2>
            <div className="space-y-3">
              {byOrders.map((runner, index) => (
                <Link key={runner.id} href={`/runner/${runner.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition">
                    <span className={`w-6 text-center font-bold ${index < 3 ? 'text-yellow-400' : 'text-slate-400'}`}>{index + 1}</span>
                    <div className="flex-1">
                      <div className="font-medium">{runner.nickname}</div>
                      <div className="text-xs text-slate-400">{runner.platform === 'PC' ? '端游' : runner.platform === 'MOBILE' ? '手游' : '两者都可'}</div>
                    </div>
                    <div className="text-green-400 font-bold">{runner.ordersCount}单</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">⭐ 评分榜</h2>
            <div className="space-y-3">
              {byRating.map((runner, index) => (
                <Link key={runner.id} href={`/runner/${runner.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition">
                    <span className={`w-6 text-center font-bold ${index < 3 ? 'text-yellow-400' : 'text-slate-400'}`}>{index + 1}</span>
                    <div className="flex-1">
                      <div className="font-medium">{runner.nickname}</div>
                      <div className="text-xs text-slate-400">{runner.ordersCount}单</div>
                    </div>
                    <div className="text-yellow-400 font-bold">★ {runner.rating}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
