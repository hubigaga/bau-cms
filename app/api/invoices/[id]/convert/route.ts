import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const offer = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { items: true },
  })
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (offer.type !== 'ANGEBOT')
    return NextResponse.json({ error: 'Nur Angebote können konvertiert werden' }, { status: 400 })

  const year = new Date().getFullYear()
  const count = await prisma.invoice.count({ where: { type: 'RECHNUNG', number: { startsWith: `RE-${year}-` } } })
  const number = `RE-${year}-${String(count + 1).padStart(4, '0')}`

  const invoice = await prisma.invoice.create({
    data: {
      type: 'RECHNUNG',
      number,
      date: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subtotal: offer.subtotal,
      vatRate: offer.vatRate,
      vatAmount: offer.vatAmount,
      total: offer.total,
      notes: offer.notes,
      customerId: offer.customerId,
      projectId: offer.projectId,
      sourceOfferId: offer.id,
      items: {
        create: offer.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
          vatRate: i.vatRate,
        })),
      },
    },
  })
  return NextResponse.json(invoice, { status: 201 })
}
