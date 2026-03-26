import Link from 'next/link'

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 导航栏 */}
        <nav className="flex justify-center gap-4 mb-6">
          <Link href="/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition">首页</Link>
          <Link href="/leaderboard" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition">排行榜</Link>
          <Link href="/register" className="px-4 py-2 bg-blue-600 rounded-lg text-white">我要入驻</Link>
        </nav>

        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-block">← 返回首页</Link>

        <h1 className="text-3xl font-bold mb-8 text-red-400">免责声明</h1>

        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h2 className="text-xl font-bold text-yellow-200 mb-2">重要提示</h2>
              <p className="text-yellow-200/80">
                在使用本平台前，请仔细阅读以下风险提示。使用本平台服务即表示您已了解并接受这些风险。
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. 平台不担保</h2>
          <p className="text-slate-300 leading-relaxed">
            本社区仅提供信息展示，不担保服务质量、跑手信用、交易安全。
            交易纠纷由双方自行协商解决，平台不承担任何责任。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. 游戏风险</h2>
          <p className="text-slate-300 leading-relaxed">
            跑刀服务可能违反《三角洲行动》等游戏的用户协议，导致的账号封禁、虚拟财产损失、
            游戏内处罚等风险由用户自行承担。平台不对任何游戏账号问题负责。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. 线下交易风险</h2>
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-4">
            <p className="text-red-200 font-medium mb-2">⚠️ 重要提示</p>
            <p className="text-slate-300 leading-relaxed mb-3">
              DeltaRun 平台目前仅提供<strong className="text-white">信息撮合服务</strong>，
              <strong className="text-white">不涉及资金托管、担保或代收代付</strong>。
              老板与跑手之间的资金交易（微信转账、支付宝转账、银行转账等）均为<strong className="text-white">线下自行协商完成</strong>。
            </p>
            <p className="text-slate-300 leading-relaxed mb-3">
              平台无法对线下交易进行监管、担保或赔付。如遇以下情况，平台不承担任何责任：
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
              <li>跑手收款后未提供服务或失联</li>
              <li>老板拒绝支付或恶意拖欠款项</li>
              <li>交易金额争议、服务质量纠纷</li>
              <li>因转账错误导致的资金损失</li>
              <li>任何涉及资金被骗、被盗的情况</li>
            </ul>
          </div>
          <p className="text-slate-300 leading-relaxed">
            建议双方使用闲鱼、支付宝担保交易等第三方平台进行资金托管，待服务完成后再确认付款。
            直接转账风险由交易双方自行承担。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. 建议措施</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li>首次合作建议小额测试</li>
            <li>优先选择已认证跑手</li>
            <li>保留聊天记录和交易凭证</li>
            <li>发现问题及时在平台举报</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
