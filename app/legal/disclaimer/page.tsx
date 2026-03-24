export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
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
          <h2 className="text-xl font-semibold mb-4">3. 资金安全</h2>
          <p className="text-slate-300 leading-relaxed">
            平台不介入资金流转，建议双方使用闲鱼、支付宝担保交易等第三方平台进行交易。
            直接转账风险自负，平台无法协助追回资金。
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
