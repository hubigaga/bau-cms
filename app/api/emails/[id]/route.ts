import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const email = await prisma.email.findUnique({ where: { id: params.id } })
  if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(email)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const email = await prisma.email.update({
    where: { id: params.id },
    data: {
      isRead: body.isRead,
      projectId: body.projectId,
      customerId: body.customerId,
    },
  })
  return NextResponse.json(email)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.email.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
