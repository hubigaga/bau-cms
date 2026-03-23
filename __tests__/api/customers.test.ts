import { GET, POST } from '@/app/api/customers/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findMany: jest.fn().mockResolvedValue([
        { id: '1', name: 'Müller GmbH', email: 'info@mueller.de', phone: null, address: null, notes: null, createdAt: new Date() },
      ]),
      create: jest.fn().mockResolvedValue({ id: '2', name: 'Test AG', email: null, phone: null, address: null, notes: null, createdAt: new Date() }),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

test('GET /api/customers returns customer list', async () => {
  const req = new Request('http://localhost/api/customers')
  const res = await GET(req)
  const data = await res.json()
  expect(res.status).toBe(200)
  expect(data).toHaveLength(1)
  expect(data[0].name).toBe('Müller GmbH')
})

test('POST /api/customers creates a customer', async () => {
  const req = new Request('http://localhost/api/customers', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test AG' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(201)
})
