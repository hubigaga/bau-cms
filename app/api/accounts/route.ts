import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view')
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()
  const quarter = searchParams.get('quarter') ? Number(searchParams.get('quarter')) : null

  const accounts = await prisma.account.findMany({
    include: {
      debitEntries: true,
      creditEntries: true,
    },
    orderBy: { number: 'asc' },
  })

  const withBalance = accounts.map(a => ({
    ...a,
    balance: a.debitEntries.reduce((s, e) => s + e.amount, 0)
           - a.creditEntries.reduce((s, e) => s + e.amount, 0),
  }))

  if (view === 'balance') {
    const aktiva = withBalance.filter(a => a.type === 'AKTIV')
    const passiva = withBalance.filter(a => a.type === 'PASSIV')
    return NextResponse.json({
      aktiva,
      totalAktiva: aktiva.reduce((s, a) => s + a.balance, 0),
      passiva,
      totalPassiva: passiva.reduce((s, a) => s + Math.abs(a.balance), 0),
    })
  }

  if (view === 'income') {
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year}-12-31`)
    const filtered = accounts.map(a => ({
      ...a,
      balance: a.debitEntries.filter(e => e.date >= startDate && e.date <= endDate).reduce((s, e) => s + e.amount, 0)
             - a.creditEntries.filter(e => e.date >= startDate && e.date <= endDate).reduce((s, e) => s + e.amount, 0),
    }))
    const ertrag = filtered.filter(a => a.type === 'ERTRAG')
    const aufwand = filtered.filter(a => a.type === 'AUFWAND')
    const gesamtErtrag = ertrag.reduce((s, a) => s + Math.abs(a.balance), 0)
    const gesamtAufwand = aufwand.reduce((s, a) => s + a.balance, 0)
    return NextResponse.json({ ertrag, aufwand, gesamtErtrag, gesamtAufwand, ergebnis: gesamtErtrag - gesamtAufwand })
  }

  if (view === 'vat') {
    let startDate: Date, endDate: Date
    if (quarter) {
      const m = (quarter - 1) * 3
      startDate = new Date(year, m, 1)
      endDate = new Date(year, m + 3, 0)
    } else {
      startDate = new Date(`${year}-01-01`)
      endDate = new Date(`${year}-12-31`)
    }
    const vat19 = withBalance.find(a => a.number === '1766')
    const vat7 = withBalance.find(a => a.number === '1771')
    const preVat19 = withBalance.find(a => a.number === '1576')
    const preVat7 = withBalance.find(a => a.number === '1571')
    const collected = (vat19?.balance ?? 0) + (vat7?.balance ?? 0)
    const input = (preVat19?.balance ?? 0) + (preVat7?.balance ?? 0)
    return NextResponse.json({ collected, input, zahllast: collected - input, vat19, vat7, preVat19, preVat7 })
  }

  return NextResponse.json(withBalance)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const account = await prisma.account.create({
    data: { number: body.number, name: body.name, type: body.type },
  })
  return NextResponse.json(account, { status: 201 })
}
