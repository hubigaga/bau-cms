// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const dbUrl = (process.env.DATABASE_URL ?? 'file:./data/cms.db').replace(/^file:/, '')
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

const SKR03_ACCOUNTS = [
  { number: '1000', name: 'Kasse', type: 'AKTIV' as const },
  { number: '1200', name: 'Bank', type: 'AKTIV' as const },
  { number: '1400', name: 'Forderungen aus L+L', type: 'AKTIV' as const },
  { number: '1576', name: 'Vorsteuer 19%', type: 'AKTIV' as const },
  { number: '1571', name: 'Vorsteuer 7%', type: 'AKTIV' as const },
  { number: '1600', name: 'Verbindlichkeiten aus L+L', type: 'PASSIV' as const },
  { number: '1766', name: 'Umsatzsteuer 19%', type: 'PASSIV' as const },
  { number: '1771', name: 'Umsatzsteuer 7%', type: 'PASSIV' as const },
  { number: '2000', name: 'Eigenkapital', type: 'PASSIV' as const },
  { number: '3000', name: 'Materialaufwand', type: 'AUFWAND' as const },
  { number: '3200', name: 'Fremdleistungen', type: 'AUFWAND' as const },
  { number: '4000', name: 'Löhne und Gehälter', type: 'AUFWAND' as const },
  { number: '4200', name: 'Raumkosten', type: 'AUFWAND' as const },
  { number: '4300', name: 'Versicherungen', type: 'AUFWAND' as const },
  { number: '4500', name: 'Fahrzeugkosten', type: 'AUFWAND' as const },
  { number: '4600', name: 'Werbekosten', type: 'AUFWAND' as const },
  { number: '4900', name: 'Sonstige Betriebsausgaben', type: 'AUFWAND' as const },
  { number: '8400', name: 'Erlöse 19% USt', type: 'ERTRAG' as const },
  { number: '8300', name: 'Erlöse 7% USt', type: 'ERTRAG' as const },
  { number: '8000', name: 'Erlöse steuerfrei', type: 'ERTRAG' as const },
]

async function main() {
  for (const account of SKR03_ACCOUNTS) {
    await prisma.account.upsert({
      where: { number: account.number },
      update: {},
      create: account,
    })
  }
  console.log(`Seeded ${SKR03_ACCOUNTS.length} SKR03 accounts`)

  const username = process.env.ADMIN_USERNAME ?? 'admin'
  const password = process.env.ADMIN_PASSWORD ?? 'changeme'
  const hash = await bcrypt.hash(password, 12)
  await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, password: hash },
  })
  console.log(`Admin user '${username}' ready`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
