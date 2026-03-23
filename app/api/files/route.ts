import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSubdir, getUploadPath, ensureDir } from '@/lib/files'
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = [
  'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]
const MAX_SIZE = 50 * 1024 * 1024

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId') ?? undefined
  const customerId = searchParams.get('customerId') ?? undefined
  const files = await prisma.file.findMany({
    where: { projectId, customerId },
    orderBy: { uploadedAt: 'desc' },
  })
  return NextResponse.json(files)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const projectId = formData.get('projectId') as string | null
  const customerId = formData.get('customerId') as string | null

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Dateityp nicht erlaubt' }, { status: 400 })
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: 'Datei zu groß (max. 50MB)' }, { status: 400 })

  const subdir = getSubdir(projectId ?? undefined, customerId ?? undefined)
  const ext = path.extname(file.name)
  const storedName = `${randomUUID()}${ext}`
  const filePath = getUploadPath(subdir, storedName)

  await ensureDir(path.dirname(filePath))
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  const record = await prisma.file.create({
    data: {
      filename: file.name,
      path: path.join(subdir, storedName),
      mimetype: file.type,
      size: file.size,
      projectId: projectId ?? null,
      customerId: customerId ?? null,
    },
  })
  return NextResponse.json(record, { status: 201 })
}
