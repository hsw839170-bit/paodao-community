import { RunnerCard } from '@/components/RunnerCard'
import { staticRunners } from '@/data/runners'

export default function Home() {
  const runners = staticRunners

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">DeltaRun 🚀</h1>
          <p className="text-xl text-slate-300">三角洲跑刀社区</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{runners.length}</div>
            <div className="text-sm text-slate-400">入驻跑手</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{runners.filter(r => r.verified).length}</div>
            <div className="text-sm text-slate-400">已认证</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{runners.reduce((sum, r) => sum + r.orders, 0)}</div>
            <div className="text-sm text-slate-400">累计订单</div>
          </div>
        </div>

        {/* Runner List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">跑手列表</h2>
            <a 
              href="/register" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition"
            >
              我要入驻
            </a>
          </div>

          <div className="grid gap-4">
            {runners.map((runner) => (
              <RunnerCard key={runner.id} runner={runner} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-400 text-sm">
          <p>© 2025 DeltaRun - 信息展示平台</p>
          <div className="mt-2 space-x-4">
            <a href="/terms" className="hover:text-white">用户协议</a>
            <a href="/privacy" className="hover:text-white">隐私政策</a>
          </div>
        </footer>
      </div>
    </main>
  )
}
