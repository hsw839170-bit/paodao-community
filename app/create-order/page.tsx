import Link from 'next/link'
import CreateOrderForm from '@/app/components/CreateOrderForm'
import RiskWarning from '@/app/components/RiskWarning'

export const dynamic = 'force-dynamic'

export default function CreateOrderPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 导航栏 */}
        <nav className="flex justify-center gap-4 mb-8">
          <Link href="/" className="px-6 py-2.5 bg-slate-700/80 backdrop-blur rounded-full text-white font-medium hover:bg-slate-600 transition">
            首页
          </Link>
          <Link href="/public-orders" className="px-6 py-2.5 bg-slate-700/80 backdrop-blur rounded-full text-white font-medium hover:bg-slate-600 transition">
            抢单大厅
          </Link>
          <Link href="/my-orders" className="px-6 py-2.5 bg-slate-700/80 backdrop-blur rounded-full text-white font-medium hover:bg-slate-600 transition">
            我的订单
          </Link>
        </nav>

        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回首页
        </Link>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">发布订单</h1>
            <p className="text-slate-400">选择下单方式，填写订单信息</p>
          </div>

          <CreateOrderForm />
        </div>

        {/* 风险提示 */}
        <RiskWarning className="mt-6" />

        {/* Footer */}
        <footer className="mt-8 text-center text-slate-500 text-sm">
          <p>发布即表示同意 <Link href="/legal/terms" className="text-blue-400 hover:underline">用户协议</Link></p>
        </footer>
      </div>
    </main>
  )
}
