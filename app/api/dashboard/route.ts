import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [openInvoices, activeProjects, unreadEmails, overdueTasks, recentEntries] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
      _count: true,
      where: { status: { in: ['SENT', 'OVERDUE'] } },
    }),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.email.count({ where: { isRead: false, direction: 'IN' } }),
    prisma.task.count({ where: { status: { not: 'DONE' }, dueDate: { lt: new Date() } } }),
    prisma.journalEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { debitAccount: true, creditAccount: true },
    }),
  ])

  return NextResponse.json({
    openInvoices,
    activeProjects,
    unreadEmails,
    overdueTasks,
    recentEntries,
  })
}
