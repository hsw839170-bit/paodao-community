import Link from 'next/link'
import { staticRunners } from '@/data/runners'
import { notFound } from 'next/navigation'
import OrderForm from './OrderForm'

export function generateStaticParams() {
  return staticRunners.map((runner) => ({
    id: runner.id,
  }))
}

interface PageProps {
  params: { id: string }
}

export default function OrderPage({ params }: PageProps) {
  const runner = staticRunners.find(r => r.id === params.id)
  
  if (!runner) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <nav className="flex justify-center gap-4 mb-8">
          <Link href="/" className="px-6 py-2.5 bg-slate-700/80 backdrop-blur rounded-full text-white font-medium hover:bg-slate-600 transition">
            首页
          </Link>
          <Link href="/leaderboard/" className="px-6 py-2.5 bg-slate-700/80 backdrop-blur rounded-full text-white font-medium hover:bg-slate-600 transition">
            排行榜
          </Link>
        </nav>

        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回列表
        </Link>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">向 {runner.name} 下单</h1>
            <p className="text-slate-400">填写订单信息，提交后查看联系方式</p>
          </div>

          <div className="bg-slate-700/50 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl font-bold">
                {runner.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold">{runner.name}</span>
                  {runner.verified && <span className="text-green-400 text-sm">已认证</span>}
                </div>
                <div className="text-slate-400 text-sm">
                  {runner.rating} · {runner.orders}单 · {runner.platform}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">1000W哈夫币</div>
                <div className="text-2xl font-bold text-green-400">¥{runner.pricePer10M}</div>
              </div>
            </div>
          </div>

          <OrderForm runner={runner} />
        </div>
      </div>
    </main>
  )
}
