import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const IMAP_INTERVAL_MS = 2 * 60 * 1000
const DAILY_JOBS_HOUR = 6
const BACKUP_HOUR = 3
const MAX_BACKUPS = 30

let lastDailyRun = -1
let lastBackupRun = -1

async function syncImap(): Promise<void> {
  try {
    // Dynamic import to avoid @/ path alias issues in worker context
    const { syncInbox } = await import('../lib/email/imap')
    const count = await syncInbox()
    if (count > 0) console.log(`[worker] Synced ${count} new emails`)
  } catch (err) {
    console.error('[worker] IMAP sync failed:', err)
  }
}

async function runDailyJobs(): Promise<void> {
  const updated = await prisma.invoice.updateMany({
    where: { status: 'SENT', dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  })
  if (updated.count > 0) console.log(`[worker] Marked ${updated.count} invoices as OVERDUE`)
}

async function runBackup(): Promise<void> {
  const dbPath = (process.env.DATABASE_URL ?? 'file:./data/cms.db').replace('file:', '')
  const backupDir = process.env.BACKUP_DIR ?? './backups'
  fs.mkdirSync(backupDir, { recursive: true })

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const dest = path.join(backupDir, `cms-${today}.db`)
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, dest)
    console.log(`[worker] Backup written to ${dest}`)
  }

  const files = fs.readdirSync(backupDir)
    .filter((f: string) => f.startsWith('cms-') && f.endsWith('.db'))
    .sort()
  for (const old of files.slice(0, -MAX_BACKUPS)) {
    fs.unlinkSync(path.join(backupDir, old))
    console.log(`[worker] Deleted old backup: ${old}`)
  }
}

async function tick(): Promise<void> {
  await syncImap()
  const hour = new Date().getHours()
  if (hour === DAILY_JOBS_HOUR && lastDailyRun !== hour) {
    lastDailyRun = hour
    await runDailyJobs().catch(err => console.error('[worker] daily jobs failed:', err))
  }
  if (hour === BACKUP_HOUR && lastBackupRun !== hour) {
    lastBackupRun = hour
    await runBackup().catch(err => console.error('[worker] backup failed:', err))
  }
}

tick()
setInterval(tick, IMAP_INTERVAL_MS)
console.log('[worker] Started')
