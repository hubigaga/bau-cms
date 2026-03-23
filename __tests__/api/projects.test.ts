import { GET, POST } from '@/app/api/projects/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn().mockResolvedValue([
        { id: '1', title: 'Dachsanierung Müller', status: 'ACTIVE', customerId: 'c1',
          customer: { id: 'c1', name: 'Müller GmbH' }, employees: [], createdAt: new Date() },
      ]),
      create: jest.fn().mockResolvedValue({ id: '2', title: 'Neues Projekt', status: 'ACTIVE', customerId: 'c1', createdAt: new Date() }),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

test('GET /api/projects returns project list', async () => {
  const req = new Request('http://localhost/api/projects')
  const res = await GET(req)
  const data = await res.json()
  expect(res.status).toBe(200)
  expect(data).toHaveLength(1)
  expect(data[0].title).toBe('Dachsanierung Müller')
})

test('POST /api/projects creates a project', async () => {
  const req = new Request('http://localhost/api/projects', {
    method: 'POST',
    body: JSON.stringify({ title: 'Neues Projekt', customerId: 'c1' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(201)
})
