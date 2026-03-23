import { createPaymentJournalEntries } from '@/lib/accounting/journal'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    account: { findUniqueOrThrow: jest.fn() },
    journalEntry: { create: jest.fn() },
  },
}))

const { prisma } = require('@/lib/prisma')

test('createPaymentJournalEntries creates two entries for VAT split', async () => {
  prisma.account.findUniqueOrThrow
    .mockResolvedValueOnce({ id: 'bank-id' })
    .mockResolvedValueOnce({ id: 'revenue-id' })
    .mockResolvedValueOnce({ id: 'vat-id' })

  prisma.journalEntry.create.mockResolvedValue({})

  await createPaymentJournalEntries({
    paymentId: 'pay1',
    invoiceId: 'inv1',
    total: 119,
    vatRate: 19,
    date: new Date('2026-03-22'),
  })

  expect(prisma.journalEntry.create).toHaveBeenCalledTimes(2)
})
