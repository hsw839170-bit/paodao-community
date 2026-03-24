import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const runners = await prisma.runnerProfile.findMany({
      where: { status: { in: ['ONLINE', 'BUSY'] } },
      orderBy: { rating: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
          }
        }
      }
    })
    
    return NextResponse.json(runners)
  } catch (error) {
    console.error('Failed to fetch runners:', error)
    return NextResponse.json({ error: 'Failed to fetch runners' }, { status: 500 })
  }
}
