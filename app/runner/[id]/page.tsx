import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Avatar from '@/components/Avatar'

// 强制动态渲染，避免构建时静态生成
export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

async function getRunner(id: string) {
  const runner = await prisma.runnerProfile.findUnique({
    where: { id },
    include: {
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: { phone: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })
  
  return runner
}

export default async function RunnerDetailPage({ params }: PageProps) {
  const runner = await getRunner(params.id)
  
  if (!runner) {
    notFound()
  }

  // 计算评分统计
  const allReviews = await prisma.review.findMany({
    where: { runnerId: params.id },
    select: { rating: true }
  })
  
  const totalReviews = allReviews.length
  const avgRating = totalReviews > 0 
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : runner.rating.toFixed(1)
  
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: allReviews.filter(r => r.rating === star).length
  }))

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回列表
        </Link>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-6">
            <Avatar 
              src={runner.avatar || undefined} 
              alt={runner.nickname}
              size="xl"
              className="w-24 h-24"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{runner.nickname}</h1>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  runner.status === 'ONLINE'
                    ? 'bg-green-500/20 text-green-400'
                    : runner.status === 'BUSY'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {runner.status === 'ONLINE' ? '在线' : runner.status === 'BUSY' ? '忙碌中' : '离线'}
                </span>
              </div>
              
              <div className="text-slate-400 mb-4">
                {runner.platform === 'PC' ? '端游' : runner.platform === 'MOBILE' ? '手游' : '端游/手游'}
              </div>
              
              {runner.bio && (
                <p className="text-slate-300 mb-4">{runner.bio}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">评分:</span>
                  <span className="text-yellow-400 font-bold">{avgRating}★</span>
                  <span className="text-slate-500">({totalReviews}条评价)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">完成订单:</span>
                  <span className="text-green-400 font-bold">{runner.ordersCount}单</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">价格:</span>
                  <span className="text-purple-400 font-bold">¥{runner.pricePer10M}/1000W</span>
                </div>
              </div>
              
              {/* 联系方式 */}
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">联系方式：</div>
                <div className="flex flex-wrap gap-3">
                  {runner.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-slate-200">{runner.phone}</span>
                    </div>
                  )}
                  {runner.wechat && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
                      </svg>
                      <span className="text-slate-200">微信: {runner.wechat}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">* 下单后可见完整联系方式</p>
              </div>
            </div>
            
            <Link 
              href={`/order/${runner.id}`}
              className="px-6 py-3 bg-blue-600 rounded-xl font-semibold hover:bg-blue-500 transition"
            >
              立即下单
            </Link>
          </div>
        </div>

        {/* 评价统计 */}
        {totalReviews > 0 && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold mb-6">评价分布</h2>
            <div className="space-y-3">
              {distribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-4">
                  <span className="w-8 text-slate-400">{star}星</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${totalReviews > 0 ? (count / totalReviews) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-slate-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 评价列表 */}
        {runner.reviews.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6">最新评价</h2>
            <div className="space-y-4">
              {runner.reviews.map((review) => (
                <div key={review.id} className="border-b border-slate-700 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span className="text-slate-500 text-sm">{review.user.phone.slice(0, 3)}****{review.user.phone.slice(-4)}</span>
                    </div>
                    <span className="text-slate-500 text-sm">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-slate-300">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
