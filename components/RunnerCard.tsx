import Link from 'next/link'

interface Runner {
  id: string
  name: string
  avatar?: string
  platform: string
  bio?: string
  rating: number
  orders: number
  income: number
  verified: boolean
}

export function RunnerCard({ runner }: { runner: Runner }) {
  return (
    <Link href={`/runner/${runner.id}`}>
      <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition cursor-pointer shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
              {runner.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{runner.name}</h3>
                {runner.verified && (
                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                    ✓ 已认证
                  </span>
                )}
              </div>
              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                {runner.platform}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">★ {runner.rating}</div>
            <div className="text-sm text-slate-400">{runner.orders}单</div>
          </div>
        </div>

        {runner.bio && (
          <p className="mt-4 text-slate-400 text-sm line-clamp-2">{runner.bio}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            本月收入: <span className="text-green-400">¥{runner.income}</span>
          </span>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm transition">
            查看详情
          </button>
        </div>
      </div>
    </Link>
  )
}
