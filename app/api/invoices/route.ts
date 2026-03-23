import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function padNum(n: number): string {
  return String(n).padStart(4, '0')
}

async function generateNumber(type: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = type === 'ANGEBOT' ? 'AN' : type === 'GUTSCHRIFT' ? 'GS' : 'RE'
  const count = await prisma.invoice.count({
    where: { type: type as any, number: { startsWith: `${prefix}-${year}-` } },
  })
  return `${prefix}-${year}-${padNum(count + 1)}`
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const customerId = searchParams.get('customerId') ?? undefined
  const invoices = await prisma.invoice.findMany({
    where: { type: type as any, status: status as any, customerId },
    include: { customer: true, items: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const items: { description: string; quantity: number; unitPrice: number; vatRate?: number }[] =
    body.items ?? []
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const vatRate = body.vatRate ?? 19
  const vatAmount = subtotal * vatRate / 100
  const total = subtotal + vatAmount
  const number = await generateNumber(body.type)
  const invoice = await prisma.invoice.create({
    data: {
      type: body.type,
      number,
      date: new Date(body.date),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      subtotal,
      vatRate,
      vatAmount,
      total,
      notes: body.notes ?? null,
      customerId: body.customerId,
      projectId: body.projectId ?? null,
      items: {
        create: items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.quantity * i.unitPrice,
          vatRate: i.vatRate ?? vatRate,
        })),
      },
    },
  })
  return NextResponse.json(invoice, { status: 201 })
}
