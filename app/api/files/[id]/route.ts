import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const file = await prisma.file.findUnique({ where: { id: params.id } })
  if (file) {
    const fullPath = path.join(process.env.UPLOAD_DIR ?? './uploads', file.path)
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
    await prisma.file.delete({ where: { id: params.id } })
  }
  return new NextResponse(null, { status: 204 })
}
