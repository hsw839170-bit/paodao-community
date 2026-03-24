export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">隐私政策</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. 信息收集</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            我们收集以下信息用于提供服务：
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li><strong>注册信息</strong>：昵称、联系方式</li>
            <li><strong>跑手信息</strong>：姓名（实名认证时）、游戏平台偏好</li>
            <li><strong>使用数据</strong>：访问记录、操作日志</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. 信息使用</h2>
          <p className="text-slate-300 leading-relaxed">
            我们使用收集的信息用于：身份验证、信用评估、平台展示（脱敏处理）、服务改进。
            我们不会将您的个人信息出售给第三方。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. 信息保护</h2>
          <p className="text-slate-300 leading-relaxed">
            我们采用加密存储、访问控制等技术措施保护您的信息安全。
            仅必要的工作人员可访问您的个人信息。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. 用户权利</h2>
          <p className="text-slate-300 leading-relaxed">
            您有权查询、修改、删除您的个人信息。如需帮助，请联系平台客服。
          </p>
        </section>
      </div>
    </main>
  )
}
