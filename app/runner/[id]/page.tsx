import { notFound } from 'next/navigation'
import { staticRunners } from '@/data/runners'
import Link from 'next/link'

export function generateStaticParams() {
  return staticRunners.map((runner) => ({
    id: runner.id,
  }))
}

interface PageProps {
  params: { id: string }
}

export default function RunnerDetailPage({ params }: PageProps) {
  const runner = staticRunners.find(r => r.id === params.id)

  if (!runner) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-block">
          ← 返回列表
        </Link>

        <div className="bg-slate-800 rounded-lg p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl">
              {runner.name[0]}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{runner.name}</h1>
                {runner.verified ? (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">✓ 已认证</span>
                ) : (
                  <span className="bg-slate-600 text-white px-3 py-1 rounded-full text-sm">审核中</span>
                )}
              </div>
              
              <span className="inline-block px-3 py-1 bg-blue-600/30 text-blue-300 rounded-lg text-sm mb-4">{runner.platform}</span>
              
              {runner.bio && (
                <p className="text-slate-300 mb-4">{runner.bio}</p>
              )}
            </div>

            <div className="text-right">
              <div className="text-5xl font-bold text-yellow-400">★ {runner.rating}</div>
              <div className="text-slate-400 mt-1">用户评分</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400">{runner.orders}</div>
            <div className="text-slate-400 mt-1">完成订单</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400">¥{runner.income}</div>
            <div className="text-slate-400 mt-1">本月收入</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">联系方式</h2>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">{runner.contact}</span>
            <span className="text-sm text-slate-500">（请说明来自 DeltaRun）</span>
          </div>
        </div>

        <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-200 text-sm">⚠️ 风险提示：平台仅提供信息展示，交易风险由双方自行承担。建议先小额测试。</p>
        </div>
      </div>
    </main>
  )
}
