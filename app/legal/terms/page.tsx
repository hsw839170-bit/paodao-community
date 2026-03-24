export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">用户协议</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. 平台定位</h2>
          <p className="text-slate-300 leading-relaxed">
            本平台仅为信息展示与交流平台，不构成交易中介、担保方或代理方。
            跑手与老板之间的交易由双方自行协商完成，平台不介入资金流转，不担保交易安全。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. 用户责任</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            用户在使用本平台服务时，应当遵守以下规定：
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li>跑刀服务可能违反游戏用户协议，导致的账号封禁、财产损失等风险由用户自行承担</li>
            <li>禁止发布外挂、脚本、作弊工具等相关信息</li>
            <li>禁止欺诈、诈骗等违法行为</li>
            <li>禁止发布违法违规内容</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. 平台权利</h2>
          <p className="text-slate-300 leading-relaxed">
            平台有权删除违规内容，无需事先通知。平台有权对违规用户进行封号、公示等处理。
            平台保留随时修改或中断服务而不需通知用户的权利。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. 免责声明</h2>
          <p className="text-slate-300 leading-relaxed">
            平台不对任何交易纠纷、账号损失承担责任。纠纷由双方自行解决或通过法律途径处理。
            因不可抗力或第三方原因导致的服务中断，平台不承担责任。
          </p>
        </section>
      </div>
    </main>
  )
}
