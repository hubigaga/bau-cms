import { prisma } from '@/lib/prisma'
import { SKR03 } from './skr03'

export async function createPaymentJournalEntries(opts: {
  paymentId: string
  invoiceId: string
  total: number
  vatRate: number
  date: Date
}): Promise<void> {
  const { paymentId, invoiceId, total, vatRate, date } = opts
  const netAmount = total / (1 + vatRate / 100)
  const vatAmount = total - netAmount

  const bankAccount = await prisma.account.findUniqueOrThrow({ where: { number: SKR03.BANK } })
  const revenueAccount = await prisma.account.findUniqueOrThrow({
    where: { number: vatRate === 7 ? SKR03.REVENUE_7 : SKR03.REVENUE_19 },
  })
  const vatAccount = await prisma.account.findUniqueOrThrow({
    where: { number: vatRate === 7 ? SKR03.VAT_7 : SKR03.VAT_19 },
  })

  await prisma.journalEntry.create({
    data: {
      date,
      description: 'Zahlungseingang Rechnung',
      amount: netAmount,
      debitAccountId: bankAccount.id,
      creditAccountId: revenueAccount.id,
      invoiceId,
      paymentId,
    },
  })

  await prisma.journalEntry.create({
    data: {
      date,
      description: `USt ${vatRate}% Zahlungseingang`,
      amount: vatAmount,
      debitAccountId: bankAccount.id,
      creditAccountId: vatAccount.id,
      invoiceId,
      paymentId,
    },
  })
}
