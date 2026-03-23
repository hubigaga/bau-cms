import { ImapFlow } from 'imapflow'
import sanitizeHtml from 'sanitize-html'
import { prisma } from '@/lib/prisma'

export async function syncInbox(): Promise<number> {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT ?? 993),
    secure: true,
    auth: { user: process.env.IMAP_USER!, pass: process.env.IMAP_PASS! },
    logger: false,
  })

  let newCount = 0
  await client.connect()
  const lock = await client.getMailboxLock('INBOX')

  try {
    for await (const msg of client.fetch('1:50', { envelope: true, bodyStructure: true, source: true })) {
      const messageId = msg.envelope.messageId
      if (!messageId) continue

      const exists = await prisma.email.findUnique({ where: { messageId } })
      if (exists) continue

      const rawBody = msg.source?.toString('utf-8') ?? ''
      const htmlMatch = rawBody.match(/<html[\s\S]*?<\/html>/i)
      const body = htmlMatch
        ? sanitizeHtml(htmlMatch[0], {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
          })
        : rawBody.split('\r\n\r\n').slice(1).join('\n').trim()

      await prisma.email.create({
        data: {
          messageId,
          subject: msg.envelope.subject ?? '(kein Betreff)',
          fromAddr: msg.envelope.from?.[0]?.address ?? '',
          toAddr: msg.envelope.to?.[0]?.address ?? '',
          body,
          bodyType: htmlMatch ? 'html' : 'text',
          direction: 'IN',
          sentAt: msg.envelope.date ?? new Date(),
          isRead: false,
        },
      })
      newCount++
    }
  } finally {
    lock.release()
    await client.logout()
  }

  return newCount
}
