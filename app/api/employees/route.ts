import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(employees)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const employee = await prisma.employee.create({
    data: {
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      role: body.role ?? null,
    },
  })
  return NextResponse.json(employee, { status: 201 })
}
