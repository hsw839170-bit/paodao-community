import Link from 'next/link'
import { staticRunners } from '@/data/runners'

export default function LeaderboardPage() {
  const byIncome = [...staticRunners].sort((a, b) => b.income - a.income).slice(0, 10)
  const byOrders = [...staticRunners].sort((a, b) => b.orders - a.orders).slice(0, 10)
  const byRating = [...staticRunners].filter(r => r.orders >= 10).sort((a, b) => b.rating - a.rating).slice(0, 10)

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
                      <div className="font-medium">{runner.name}</div>
                      <div className="text-xs text-slate-400">{runner.platform}</div>
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
                      <div className="font-medium">{runner.name}</div>
                      <div className="text-xs text-slate-400">{runner.platform}</div>
                    </div>
                    <div className="text-green-400 font-bold">{runner.orders}单</div>
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
                      <div className="font-medium">{runner.name}</div>
                      <div className="text-xs text-slate-400">{runner.orders}单</div>
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
