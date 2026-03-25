import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Avatar from '@/components/Avatar'

interface PageProps {
  params: { id: string }
}

async function getRunner(id: string) {
  const runner = await prisma.runnerProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true }
      },
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
