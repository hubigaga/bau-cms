import { GET, POST } from '@/app/api/invoices/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'inv1', type: 'RECHNUNG', number: 'RE-2026-0001', status: 'DRAFT',
          date: new Date(), total: 119, customerId: 'c1',
          customer: { name: 'Müller GmbH' },
        },
      ]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'inv2', number: 'RE-2026-0001' }),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

test('GET /api/invoices returns invoice list', async () => {
  const req = new Request('http://localhost/api/invoices')
  const res = await GET(req)
  const data = await res.json()
  expect(res.status).toBe(200)
  expect(data).toHaveLength(1)
})

test('POST /api/invoices creates invoice', async () => {
  const req = new Request('http://localhost/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'RECHNUNG',
      customerId: 'c1',
      date: '2026-03-22',
      items: [{ description: 'Arbeit', quantity: 10, unitPrice: 100, vatRate: 19 }],
    }),
  })
  const res = await POST(req)
  expect(res.status).toBe(201)
})
