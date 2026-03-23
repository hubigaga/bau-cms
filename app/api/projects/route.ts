import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const projects = await prisma.project.findMany({
    where: status ? { status: status as any } : undefined,
    include: { customer: true, employees: { include: { employee: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const project = await prisma.project.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? 'ACTIVE',
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      customerId: body.customerId,
    },
  })
  return NextResponse.json(project, { status: 201 })
}
