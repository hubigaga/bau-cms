import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId') ?? undefined
  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    include: { employee: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      projectId: body.projectId,
      assignedTo: body.assignedTo ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })
  return NextResponse.json(task, { status: 201 })
}
