import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { currentPassword, newPassword } = await req.json()
  const user = await prisma.user.findUnique({ where: { username: session.user!.name! } })
  if (!user || !(await bcrypt.compare(currentPassword, user.password)))
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 403 })
  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } })
  return new NextResponse(null, { status: 204 })
}
