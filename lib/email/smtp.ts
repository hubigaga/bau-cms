import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  projectId?: string
  customerId?: string
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })

  await prisma.email.create({
    data: {
      subject: opts.subject,
      fromAddr: process.env.SMTP_FROM ?? '',
      toAddr: opts.to,
      body: opts.html,
      bodyType: 'html',
      direction: 'OUT',
      sentAt: new Date(),
      isRead: true,
      projectId: opts.projectId ?? null,
      customerId: opts.customerId ?? null,
    },
  })
}
