import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      projects: { include: { project: true } },
      timeEntries: { orderBy: { date: 'desc' }, take: 10 },
    },
  })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(employee)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: { name: body.name, email: body.email, phone: body.phone, role: body.role },
  })
  return NextResponse.json(employee)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.employee.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
