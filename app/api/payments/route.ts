import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPaymentJournalEntries } from '@/lib/accounting/journal'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: body.invoiceId },
  })

  const payment = await prisma.payment.create({
    data: {
      invoiceId: body.invoiceId,
      amount: Number(body.amount),
      date: new Date(body.date),
      method: body.method ?? null,
    },
  })

  await createPaymentJournalEntries({
    paymentId: payment.id,
    invoiceId: body.invoiceId,
    total: Number(body.amount),
    vatRate: invoice.vatRate,
    date: new Date(body.date),
  })

  const totalPaid = await prisma.payment.aggregate({
    where: { invoiceId: body.invoiceId },
    _sum: { amount: true },
  })

  if ((totalPaid._sum.amount ?? 0) >= invoice.total) {
    await prisma.invoice.update({
      where: { id: body.invoiceId },
      data: { status: 'PAID' },
    })
  }

  return NextResponse.json(payment, { status: 201 })
}
