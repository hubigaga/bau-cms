import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/invoices/InvoicePDF'
import nodemailer from 'nodemailer'
import React from 'react'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { customer: true, items: true },
  })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!invoice.customer?.email)
    return NextResponse.json({ error: 'Kunde hat keine E-Mail-Adresse' }, { status: 400 })

  const pdfBuffer = await renderToBuffer(React.createElement(InvoicePDF, { invoice }))

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const subject = `${invoice.type === 'ANGEBOT' ? 'Angebot' : 'Rechnung'} ${invoice.number}`
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: invoice.customer.email,
    subject,
    html: `<p>Sehr geehrte Damen und Herren,<br><br>anbei erhalten Sie ${
      invoice.type === 'ANGEBOT' ? 'unser Angebot' : 'unsere Rechnung'
    } ${invoice.number}.<br><br>Mit freundlichen Grüßen</p>`,
    attachments: [{ filename: `${invoice.number}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  })

  await prisma.email.create({
    data: {
      subject,
      fromAddr: process.env.SMTP_FROM ?? '',
      toAddr: invoice.customer.email,
      body: `${invoice.type === 'ANGEBOT' ? 'Angebot' : 'Rechnung'} ${invoice.number} gesendet`,
      bodyType: 'text',
      direction: 'OUT',
      sentAt: new Date(),
      isRead: true,
      customerId: invoice.customerId,
    },
  })

  await prisma.invoice.update({
    where: { id: params.id },
    data: { status: 'SENT' },
  })

  return NextResponse.json({ ok: true })
}
