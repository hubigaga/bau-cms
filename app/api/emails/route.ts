import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/smtp'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const direction = searchParams.get('direction') ?? undefined
  const projectId = searchParams.get('projectId') ?? undefined
  const customerId = searchParams.get('customerId') ?? undefined
  const isRead = searchParams.get('isRead')
  const emails = await prisma.email.findMany({
    where: {
      direction: direction as any,
      projectId,
      customerId,
      isRead: isRead !== null ? isRead === 'true' : undefined,
    },
    orderBy: { sentAt: 'desc' },
  })
  return NextResponse.json(emails)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  await sendEmail({
    to: body.to,
    subject: body.subject,
    html: body.html ?? `<p>${body.body ?? ''}</p>`,
    projectId: body.projectId,
    customerId: body.customerId,
  })
  return new NextResponse(null, { status: 201 })
}
