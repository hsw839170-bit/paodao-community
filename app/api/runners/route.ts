import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const runners = await prisma.runner.findMany({
      where: { status: 'active' },
      orderBy: { rating: 'desc' }
    })
    
    return NextResponse.json(runners)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch runners' }, { status: 500 })
  }
}
