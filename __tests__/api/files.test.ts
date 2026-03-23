import { GET } from '@/app/api/files/[id]/download/route'

jest.mock('next-auth', () => ({ getServerSession: jest.fn().mockResolvedValue(null) }))
jest.mock('@/lib/prisma', () => ({ prisma: { file: { findUnique: jest.fn() } } }))

test('download without session returns 401', async () => {
  const req = new Request('http://localhost/api/files/abc/download')
  const res = await GET(req, { params: { id: 'abc' } })
  expect(res.status).toBe(401)
})
