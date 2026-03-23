import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const file = await prisma.file.findUnique({ where: { id: params.id } })
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fullPath = path.join(process.env.UPLOAD_DIR ?? './uploads', file.path)
  if (!fs.existsSync(fullPath)) return NextResponse.json({ error: 'File missing' }, { status: 404 })

  const buffer = fs.readFileSync(fullPath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': file.mimetype,
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Length': String(file.size),
    },
  })
}
