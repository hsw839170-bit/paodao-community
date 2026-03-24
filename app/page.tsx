import { RunnerCard } from '@/components/RunnerCard'
import { staticRunners } from '@/data/runners'

export default function Home() {
  const runners = staticRunners

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%234f46e5%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 py-16 relative">
          {/* 导航栏 - 简化：首页 | 排行榜 | 个人中心 */}
          <nav className="flex justify-center gap-4 mb-12">
            <a href="/" className="px-6 py-2.5 bg-blue-600 rounded-full text-white font-medium shadow-lg shadow-blue-600/30 transition hover:scale-105">
              首页
            </a>
            <a href="/leaderboard" className="px-6 py-2.5 bg-slate-700/80 backdrop-blur rounded-full text-white font-medium hover:bg-slate-600 transition hover:scale-105">
              排行榜
            </a>
            <a href="/profile" className="px-6 py-2.5 bg-slate-700/80 backdrop-blur rounded-full text-white font-medium hover:bg-slate-600 transition hover:scale-105">
              个人中心
            </a>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              已上线运营
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              DeltaRun 🚀
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-4">
              三角洲跑刀社区
            </p>
            
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              专业的跑刀信息服务平台，实名认证、透明评分、安全交易
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-semibold text-lg shadow-xl shadow-blue-600/30 transition hover:scale-105 hover:shadow-2xl">
                立即入驻 🚀
              </a>
              <a href="/leaderboard" className="px-8 py-4 bg-slate-700/80 backdrop-blur rounded-full font-semibold text-lg border border-slate-600 transition hover:bg-slate-600 hover:scale-105">
                查看排行榜 📊
              </a>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500/50 transition">
              <div className="text-3xl font-bold text-blue-400 mb-1">{runners.length}</div>
              <div className="text-sm text-slate-400">入驻跑手</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center hover:border-green-500/50 transition">
              <div className="text-3xl font-bold text-green-400 mb-1">{runners.filter(r => r.verified).length}</div>
              <div className="text-sm text-slate-400">已认证</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center hover:border-yellow-500/50 transition">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{runners.reduce((sum, r) => sum + r.orders, 0)}</div>
              <div className="text-sm text-slate-400">累计订单</div>
            </div>
          </div>
        </div>
      </section>

      {/* Runner List Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">在线跑手</h2>
          <p className="text-slate-400 text-sm">以下跑手当前可接单，点击下单查看联系方式</p>
        </div>

        <div className="grid gap-6">
          {runners
            .filter(runner => runner.status === 'online')
            .map((runner) => (
              <RunnerCard key={runner.id} runner={runner} />
            ))}
        </div>
        
        {runners.filter(r => r.status === 'online').length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg mb-2">暂无可接单的跑手</p>
            <p>请稍后再来看看 👋</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-slate-400 text-sm">
          <p>© 2025 DeltaRun - 信息展示平台</p>
          <div className="mt-4 space-x-6">
            <a href="/legal/terms/" className="hover:text-white transition">用户协议</a>
            <a href="/legal/privacy/" className="hover:text-white transition">隐私政策</a>
            <a href="/legal/disclaimer/" className="hover:text-white transition">免责声明</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
