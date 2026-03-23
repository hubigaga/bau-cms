import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const entry = await prisma.timeEntry.update({
    where: { id: params.id },
    data: {
      hours: body.hours !== undefined ? Number(body.hours) : undefined,
      date: body.date ? new Date(body.date) : undefined,
      description: body.description,
    },
  })
  return NextResponse.json(entry)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.timeEntry.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
