import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId') ?? undefined
  const entries = await prisma.timeEntry.findMany({
    where: projectId ? { projectId } : undefined,
    include: { employee: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(entries)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const entry = await prisma.timeEntry.create({
    data: {
      projectId: body.projectId,
      employeeId: body.employeeId,
      hours: Number(body.hours),
      date: new Date(body.date),
      description: body.description ?? null,
    },
  })
  return NextResponse.json(entry, { status: 201 })
}
