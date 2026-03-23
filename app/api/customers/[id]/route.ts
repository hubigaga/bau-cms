import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: { projects: true, invoices: { orderBy: { date: 'desc' } } },
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: { name: body.name, email: body.email, phone: body.phone, address: body.address, notes: body.notes },
  })
  return NextResponse.json(customer)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.customer.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
