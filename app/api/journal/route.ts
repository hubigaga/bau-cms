import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const where: any = {}
  if (from) where.date = { ...where.date, gte: new Date(from) }
  if (to) where.date = { ...where.date, lte: new Date(to) }
  const entries = await prisma.journalEntry.findMany({
    where,
    include: { debitAccount: true, creditAccount: true },
    orderBy: { date: 'desc' },
  })
  const totalDebit = entries.reduce((s, e) => s + e.amount, 0)
  return NextResponse.json({ entries, totalDebit, totalCredit: totalDebit })
}
