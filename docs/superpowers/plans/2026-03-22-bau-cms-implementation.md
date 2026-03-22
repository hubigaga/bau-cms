# Bau-CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack CMS for a small construction company with project management, double-entry bookkeeping (SKR03), bidirectional email (IMAP/SMTP), and local file storage — deployed via Docker + Caddy.

**Architecture:** Next.js 14 (App Router) monolith with Prisma + SQLite. Background worker process (separate PM2/Docker service) for IMAP polling and scheduled jobs. All file access gated behind authenticated API routes — no static file exposure.

**Tech Stack:** Next.js 14, Prisma ORM, SQLite, NextAuth.js, imapflow, nodemailer, @react-pdf/renderer, Tailwind CSS, Lucide React, Jest, React Testing Library, Docker Compose, Caddy.

---

## File Map

```
bau-cms/
├── app/
│   ├── layout.tsx                        # Root layout: sidebar + topbar
│   ├── page.tsx                          # Dashboard (widgets)
│   ├── globals.css                       # CSS custom properties (design tokens)
│   ├── (auth)/login/page.tsx             # Login page
│   ├── projects/page.tsx                 # Project list
│   ├── projects/[id]/page.tsx            # Project detail (tasks, time, files, emails)
│   ├── customers/page.tsx
│   ├── customers/[id]/page.tsx
│   ├── employees/page.tsx
│   ├── invoices/page.tsx                 # Angebote + Rechnungen list
│   ├── invoices/[id]/page.tsx            # Invoice detail + PDF preview
│   ├── accounting/page.tsx               # Journal
│   ├── accounting/accounts/page.tsx      # Kontenplan
│   ├── accounting/balance/page.tsx       # Bilanz
│   ├── accounting/income/page.tsx        # GuV
│   ├── accounting/vat/page.tsx           # MwSt-Übersicht
│   ├── emails/page.tsx                   # Inbox + compose
│   ├── files/page.tsx                    # File browser
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── projects/route.ts             # GET list, POST create
│       ├── projects/[id]/route.ts        # GET, PUT, DELETE
│       ├── customers/route.ts
│       ├── customers/[id]/route.ts
│       ├── employees/route.ts
│       ├── employees/[id]/route.ts
│       ├── tasks/route.ts
│       ├── tasks/[id]/route.ts
│       ├── time-entries/route.ts
│       ├── time-entries/[id]/route.ts
│       ├── invoices/route.ts
│       ├── invoices/[id]/route.ts
│       ├── invoices/[id]/convert/route.ts  # Angebot → Rechnung
│       ├── invoices/[id]/send/route.ts     # PDF + E-Mail senden
│       ├── payments/route.ts
│       ├── accounts/route.ts
│       ├── journal/route.ts
│       ├── dashboard/route.ts              # Aggregated widget data
│       ├── emails/route.ts
│       ├── emails/[id]/route.ts
│       ├── files/route.ts                  # Upload
│       └── files/[id]/download/route.ts    # Auth-protected download
├── components/
│   ├── layout/Sidebar.tsx
│   ├── layout/TopBar.tsx
│   ├── ui/Button.tsx
│   ├── ui/Input.tsx
│   ├── ui/Table.tsx
│   ├── ui/Card.tsx
│   ├── ui/Badge.tsx
│   ├── ui/Modal.tsx
│   ├── projects/ProjectList.tsx
│   ├── projects/ProjectForm.tsx
│   ├── projects/TaskBoard.tsx
│   ├── projects/TimeEntryList.tsx
│   ├── invoices/InvoiceForm.tsx
│   ├── invoices/InvoiceItemEditor.tsx
│   ├── invoices/InvoicePDF.tsx
│   ├── invoices/PaymentForm.tsx
│   ├── emails/EmailList.tsx
│   ├── emails/EmailDetail.tsx
│   ├── emails/ComposeModal.tsx
│   └── files/FileUploadZone.tsx
├── lib/
│   ├── prisma.ts                         # Prisma singleton
│   ├── auth.ts                           # NextAuth config + options
│   ├── email/imap.ts                     # imapflow IMAP fetch
│   ├── email/smtp.ts                     # nodemailer send
│   ├── accounting/journal.ts             # Auto-booking helpers
│   ├── accounting/skr03.ts               # Account number constants
│   └── files.ts                          # Upload path helpers
├── worker/
│   └── index.ts                          # PM2 worker: IMAP, OVERDUE, backup
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                           # SKR03 accounts + admin user
├── middleware.ts                          # Session guard for all routes
├── __tests__/
│   ├── api/projects.test.ts
│   ├── api/invoices.test.ts
│   ├── api/files.test.ts
│   ├── api/emails.test.ts
│   ├── lib/journal.test.ts
│   └── components/InvoiceForm.test.tsx
├── Dockerfile
├── docker-compose.yml
├── docker-compose.override.yml
├── Caddyfile
├── .env.example
├── tailwind.config.ts
├── next.config.ts
└── jest.config.ts
```

---

## Phase 1: Foundation

**Goal:** Working Next.js app with GitHub repo, Docker setup, Prisma schema, NextAuth login, and design system shell.

---

### Task 1: GitHub Repository + Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`
- Create: `.gitignore`, `.env.example`
- Create: `jest.config.ts`, `jest.setup.ts`

- [ ] **Step 1: Verify GitHub CLI is authenticated**

```bash
gh auth status
```
Expected: shows logged-in user. If not: run `gh auth login`.

- [ ] **Step 2: Create GitHub repository**

```bash
cd /root/bau-cms
gh repo create bau-cms --public --source=. --remote=origin --push
```

- [ ] **Step 3: Scaffold Next.js project**

```bash
cd /root/bau-cms
npx create-next-app@14 . --typescript --tailwind --app --src-dir=no --import-alias="@/*" --yes
```

- [ ] **Step 4: Install dependencies**

```bash
npm install prisma @prisma/client next-auth bcryptjs nodemailer imapflow @react-pdf/renderer lucide-react sanitize-html
npm install -D @types/bcryptjs @types/nodemailer @types/sanitize-html jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest
```

- [ ] **Step 5: Write `.env.example`**

```bash
cat > .env.example << 'EOF'
# Database
DATABASE_URL="file:./data/cms.db"

# Auth
NEXTAUTH_SECRET="change-me-to-a-random-32-char-string"
NEXTAUTH_URL="https://yourdomain.com"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="bcrypt-hash-of-your-password"

# IMAP (eingehende E-Mails)
IMAP_HOST="imap.example.com"
IMAP_PORT="993"
IMAP_USER="mail@example.com"
IMAP_PASS="your-imap-password"

# SMTP (ausgehende E-Mails)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="mail@example.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Bauunternehmen <mail@example.com>"

# Pfade (in Docker via Volumes)
UPLOAD_DIR="./uploads"
BACKUP_DIR="./backups"
EOF
```

- [ ] **Step 6: Write `jest.config.ts`**

```typescript
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
}
export default config
```

- [ ] **Step 7: Write `jest.setup.ts`**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Write `.gitignore` additions**

Append to `.gitignore`:
```
.env.local
data/
uploads/
backups/
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies and Jest config"
git push origin main
```

---

### Task 2: Prisma Schema + SKR03 Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 2: Write `prisma/schema.prisma`**

Copy the full schema from the spec (`docs/superpowers/specs/2026-03-22-bau-cms-design.md`, section "Datenmodell"). The schema includes: Customer, Employee, Project, ProjectEmployee, Task, TimeEntry, File, Email, Account, JournalEntry, Invoice, InvoiceItem, Payment — with all relations and enums.

- [ ] **Step 3: Add `User` model for NextAuth**

Append to `schema.prisma`:
```prisma
model User {
  id       String @id @default(cuid())
  username String @unique
  password String // bcrypt hash
}
```

- [ ] **Step 4: Write `prisma/seed.ts`**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SKR03_ACCOUNTS = [
  { number: '1000', name: 'Kasse', type: 'AKTIV' },
  { number: '1200', name: 'Bank', type: 'AKTIV' },
  { number: '1400', name: 'Forderungen aus L+L', type: 'AKTIV' },
  { number: '1576', name: 'Vorsteuer 19%', type: 'AKTIV' },
  { number: '1571', name: 'Vorsteuer 7%', type: 'AKTIV' },
  { number: '1600', name: 'Verbindlichkeiten aus L+L', type: 'PASSIV' },
  { number: '1766', name: 'Umsatzsteuer 19%', type: 'PASSIV' },
  { number: '1771', name: 'Umsatzsteuer 7%', type: 'PASSIV' },
  { number: '2000', name: 'Eigenkapital', type: 'PASSIV' },
  { number: '3000', name: 'Materialaufwand', type: 'AUFWAND' },
  { number: '3200', name: 'Fremdleistungen', type: 'AUFWAND' },
  { number: '4000', name: 'Löhne und Gehälter', type: 'AUFWAND' },
  { number: '4200', name: 'Raumkosten', type: 'AUFWAND' },
  { number: '4300', name: 'Versicherungen', type: 'AUFWAND' },
  { number: '4500', name: 'Fahrzeugkosten', type: 'AUFWAND' },
  { number: '4600', name: 'Werbekosten', type: 'AUFWAND' },
  { number: '4900', name: 'Sonstige Betriebsausgaben', type: 'AUFWAND' },
  { number: '8400', name: 'Erlöse 19% USt', type: 'ERTRAG' },
  { number: '8300', name: 'Erlöse 7% USt', type: 'ERTRAG' },
  { number: '8000', name: 'Erlöse steuerfrei', type: 'ERTRAG' },
] as const

async function main() {
  // Accounts
  for (const account of SKR03_ACCOUNTS) {
    await prisma.account.upsert({
      where: { number: account.number },
      update: {},
      create: account,
    })
  }
  console.log(`Seeded ${SKR03_ACCOUNTS.length} SKR03 accounts`)

  // Admin user
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
```

- [ ] **Step 5: Add seed script to `package.json`**

In `package.json`, add to `"prisma"`:
```json
"prisma": {
  "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
}
```

- [ ] **Step 6: Run migration and seed**

```bash
mkdir -p data
npx prisma migrate dev --name init
npx prisma db seed
```

Expected: "Seeded 20 SKR03 accounts", "Admin user 'admin' ready"

- [ ] **Step 7: Commit**

```bash
git add prisma/ data/.gitkeep
git commit -m "feat: Prisma schema with all models + SKR03 seed"
git push
```

---

### Task 3: NextAuth Authentication

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `middleware.ts`
- Test: `__tests__/api/auth.test.ts`

- [ ] **Step 1: Write `lib/prisma.ts`**

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Write `lib/auth.ts`**

```typescript
// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Benutzername', type: 'text' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: user.id, name: user.username }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
}
```

- [ ] **Step 3: Write `app/api/auth/[...nextauth]/route.ts`**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 4: Write `middleware.ts`**

```typescript
// middleware.ts
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 5: Write login page `app/(auth)/login/page.tsx`**

```tsx
// app/(auth)/login/page.tsx
'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      username: fd.get('username'),
      password: fd.get('password'),
      redirect: false,
    })
    if (res?.ok) router.push('/')
    else setError('Ungültige Anmeldedaten')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1114]">
      <form onSubmit={handleSubmit} className="bg-[#1a1e24] border border-[#2e3640] p-8 w-full max-w-sm space-y-4">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">Anmelden</h1>
        {error && <p className="text-[#8b3a3a] text-sm">{error}</p>}
        <input name="username" placeholder="Benutzername"
          className="w-full bg-[#0f1114] border border-[#2e3640] text-[#d4d8dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6b8fa3]" />
        <input name="password" type="password" placeholder="Passwort"
          className="w-full bg-[#0f1114] border border-[#2e3640] text-[#d4d8dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6b8fa3]" />
        <button type="submit"
          className="w-full bg-[#c9a84c] text-[#0f1114] py-2 text-sm font-semibold hover:bg-[#b8973b]">
          Anmelden
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Start dev server and verify login works**

```bash
cp .env.example .env.local
# Edit .env.local: set NEXTAUTH_SECRET, ADMIN_USERNAME=admin, ADMIN_PASSWORD=changeme
npx prisma db seed  # ensure user exists
npm run dev
# Visit http://localhost:3000 → should redirect to /login
# Login with admin/changeme → should redirect to /
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: NextAuth login with SQLite credentials provider"
git push
```

---

### Task 4: Design System Shell (Layout + CSS Tokens)

**Files:**
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `components/layout/Sidebar.tsx`
- Create: `components/layout/TopBar.tsx`
- Create: `components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Table.tsx`, `Modal.tsx`

- [ ] **Step 1: Write `app/globals.css`**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-base: #0f1114;
  --bg-surface: #1a1e24;
  --bg-elevated: #222830;
  --border: #2e3640;
  --text-primary: #d4d8dd;
  --text-muted: #7a8694;
  --accent-blue: #6b8fa3;
  --accent-gold: #c9a84c;
  --success: #4a7c59;
  --danger: #8b3a3a;
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}

.font-mono-numbers {
  font-family: 'JetBrains Mono', monospace;
}
```

- [ ] **Step 2: Write `tailwind.config.ts`**

Extend `colors` with the design tokens, set `darkMode: 'class'`, add `fontFamily` for Inter + JetBrains Mono.

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0f1114',
        surface: '#1a1e24',
        elevated: '#222830',
        border: '#2e3640',
        primary: '#d4d8dd',
        muted: '#7a8694',
        blue: '#6b8fa3',
        gold: '#c9a84c',
        success: '#4a7c59',
        danger: '#8b3a3a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { DEFAULT: '2px', sm: '2px', md: '4px', lg: '4px' },
    },
  },
}
export default config
```

- [ ] **Step 3: Write `components/layout/Sidebar.tsx`**

```tsx
// components/layout/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, HardHat, Users, UserSquare, FileText, BookOpen, Mail, FolderOpen, Settings } from 'lucide-react'

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: HardHat, label: 'Projekte' },
  { href: '/customers', icon: Users, label: 'Kunden' },
  { href: '/employees', icon: UserSquare, label: 'Mitarbeiter' },
  { href: '/invoices', icon: FileText, label: 'Angebote & Rechnungen' },
  { href: '/accounting', icon: BookOpen, label: 'Buchführung' },
  { href: '/emails', icon: Mail, label: 'E-Mails' },
  { href: '/files', icon: FolderOpen, label: 'Dateien' },
  { href: '/settings', icon: Settings, label: 'Einstellungen' },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 min-h-screen bg-[#1a1e24] border-r border-[#2e3640] flex flex-col">
      <div className="px-4 py-5 border-b border-[#2e3640]">
        <span className="text-[#c9a84c] font-semibold text-sm tracking-wide uppercase">Bau-CMS</span>
      </div>
      <nav className="flex-1 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                active
                  ? 'bg-[#222830] text-[#6b8fa3] border-l-2 border-[#6b8fa3]'
                  : 'text-[#7a8694] hover:bg-[#222830] hover:text-[#d4d8dd]'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 4: Write `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import './globals.css'

export const metadata: Metadata = { title: 'Bau-CMS' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <html lang="de">
        <body>{children}</body>
      </html>
    )
  }

  return (
    <html lang="de">
      <body className="flex min-h-screen bg-[#0f1114]">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Write primitive UI components**

`components/ui/Card.tsx`:
```tsx
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a1e24] border border-[#2e3640] p-4 ${className}`}>
      {children}
    </div>
  )
}
```

`components/ui/Badge.tsx`:
```tsx
const variants = {
  default: 'bg-[#222830] text-[#7a8694]',
  success: 'bg-[#4a7c59]/20 text-[#4a7c59]',
  danger: 'bg-[#8b3a3a]/20 text-[#8b3a3a]',
  gold: 'bg-[#c9a84c]/20 text-[#c9a84c]',
  blue: 'bg-[#6b8fa3]/20 text-[#6b8fa3]',
} as const

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: keyof typeof variants }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-mono ${variants[variant]}`}>
      {children}
    </span>
  )
}
```

`components/ui/Button.tsx`:
```tsx
const variants = {
  primary: 'bg-[#c9a84c] text-[#0f1114] hover:bg-[#b8973b]',
  secondary: 'bg-[#222830] text-[#d4d8dd] border border-[#2e3640] hover:bg-[#2e3640]',
  danger: 'bg-[#8b3a3a] text-[#d4d8dd] hover:bg-[#7a2929]',
} as const

export function Button({
  children, variant = 'primary', className = '', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
```

- [ ] **Step 6: Write placeholder `app/page.tsx`**

```tsx
// app/page.tsx
export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-[#d4d8dd] text-xl font-semibold mb-4">Dashboard</h1>
      <p className="text-[#7a8694] text-sm">Wird in Phase 6 implementiert.</p>
    </div>
  )
}
```

- [ ] **Step 7: Verify layout renders**

```bash
npm run dev
# Visit http://localhost:3000 after login
# Sidebar visible, dark theme, navigation links present
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: design system shell — sidebar, layout, UI primitives"
git push
```

---

### Task 5: Docker + Caddy Setup

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `docker-compose.override.yml`
- Create: `Caddyfile`

- [ ] **Step 1: Write `Dockerfile`**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S cms && adduser -S cms -G cms
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p data uploads backups && chown -R cms:cms .
USER cms
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
```

- [ ] **Step 2: Write `docker-compose.yml`**

```yaml
# docker-compose.yml
services:
  cms:
    build: .
    restart: unless-stopped
    environment:
      - DATABASE_URL=file:./data/cms.db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./backups:/app/backups
    depends_on: []

  cms-worker:
    build: .
    restart: unless-stopped
    command: node worker/index.js
    environment:
      - DATABASE_URL=file:./data/cms.db
      - IMAP_HOST=${IMAP_HOST}
      - IMAP_PORT=${IMAP_PORT}
      - IMAP_USER=${IMAP_USER}
      - IMAP_PASS=${IMAP_PASS}
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - cms

volumes:
  caddy_data:
  caddy_config:
```

- [ ] **Step 3: Write `docker-compose.override.yml`**

```yaml
# docker-compose.override.yml (dev only, not committed with secrets)
services:
  cms:
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
```

- [ ] **Step 4: Write `Caddyfile`**

```caddyfile
# Caddyfile
{$NEXTAUTH_URL} {
    reverse_proxy cms:3000
}
```

- [ ] **Step 5: Add `Dockerfile` build to `package.json` scripts**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "db:migrate": "prisma migrate deploy && prisma db seed",
  "lint": "next lint",
  "test": "jest"
}
```

- [ ] **Step 6: Test Docker build**

```bash
docker compose build
```
Expected: successful build, no errors.

- [ ] **Step 7: Commit**

```bash
git add Dockerfile docker-compose.yml Caddyfile .env.example
git commit -m "feat: Docker Compose setup with Caddy reverse proxy"
git push
```

---

## Phase 2: CRM — Kunden, Projekte, Mitarbeiter

**Goal:** Full CRUD for customers, projects, employees, tasks, and time entries — with list and detail pages.

---

### Task 6: Customer API + UI

**Files:**
- Create: `app/api/customers/route.ts`, `app/api/customers/[id]/route.ts`
- Create: `app/customers/page.tsx`, `app/customers/[id]/page.tsx`
- Test: `__tests__/api/customers.test.ts`

- [ ] **Step 1: Write failing test for customer list API**

```typescript
// __tests__/api/customers.test.ts
import { GET, POST } from '@/app/api/customers/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findMany: jest.fn().mockResolvedValue([
        { id: '1', name: 'Müller GmbH', email: 'info@mueller.de', phone: null, address: null, notes: null, createdAt: new Date() },
      ]),
      create: jest.fn().mockResolvedValue({ id: '2', name: 'Test AG', email: null, phone: null, address: null, notes: null, createdAt: new Date() }),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

test('GET /api/customers returns customer list', async () => {
  const req = new Request('http://localhost/api/customers')
  const res = await GET(req)
  const data = await res.json()
  expect(res.status).toBe(200)
  expect(data).toHaveLength(1)
  expect(data[0].name).toBe('Müller GmbH')
})

test('POST /api/customers creates a customer', async () => {
  const req = new Request('http://localhost/api/customers', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test AG' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(201)
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
npm test -- --testPathPattern=customers
```
Expected: FAIL — "Cannot find module '@/app/api/customers/route'"

- [ ] **Step 3: Write `app/api/customers/route.ts`**

```typescript
// app/api/customers/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(customers)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const customer = await prisma.customer.create({
    data: {
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(customer, { status: 201 })
}
```

- [ ] **Step 4: Write `app/api/customers/[id]/route.ts`**

```typescript
// app/api/customers/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: { projects: true, invoices: { orderBy: { date: 'desc' } } },
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: { name: body.name, email: body.email, phone: body.phone, address: body.address, notes: body.notes },
  })
  return NextResponse.json(customer)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.customer.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npm test -- --testPathPattern=customers
```
Expected: PASS (2 tests)

- [ ] **Step 6: Write `app/customers/page.tsx`** (client-side fetch + table + create form modal)

Basic pattern (repeat for all list pages):
```tsx
'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  useEffect(() => { fetch('/api/customers').then(r => r.json()).then(setCustomers) }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">Kunden</h1>
        <Button>Neuer Kunde</Button>
      </div>
      {/* Customer table */}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: customers CRUD API and list/detail pages"
git push
```

---

### Task 7: Projects API + Detail Page

**Files:**
- Create: `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`
- Create: `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`
- Create: `app/api/time-entries/route.ts`, `app/api/time-entries/[id]/route.ts`
- Create: `app/projects/page.tsx`, `app/projects/[id]/page.tsx`
- Create: `components/projects/TaskBoard.tsx`
- Test: `__tests__/api/projects.test.ts`

- [ ] **Step 1: Write failing tests for project API**

```typescript
// __tests__/api/projects.test.ts
// Mock prisma.project.findMany, create — same pattern as customers
// Test GET returns list with customer included
// Test POST creates with customerId
// Test status filter: GET /api/projects?status=ACTIVE
```

- [ ] **Step 2: Run to verify failure, then implement**

Follow same pattern as Task 6. Project `findMany` should `include: { customer: true, employees: { include: { employee: true } } }`.

- [ ] **Step 3: Implement Tasks API**

`POST /api/tasks` body: `{ title, projectId, assignedTo?, dueDate? }`
`PUT /api/tasks/[id]` body: `{ status }` (for drag-and-drop status update)

- [ ] **Step 4: Implement Time Entries API**

`POST /api/time-entries` body: `{ projectId, employeeId, hours, date, description? }`
`GET /api/time-entries?projectId=xxx` returns entries for a project

- [ ] **Step 5: Write `components/projects/TaskBoard.tsx`**

Three columns: TODO, IN_PROGRESS, DONE. Click to move task between columns via `PUT /api/tasks/[id]`. Use Lucide `GripVertical` for visual affordance.

- [ ] **Step 6: Write `app/projects/[id]/page.tsx`**

Tabs: Übersicht | Aufgaben | Zeiterfassung | Dateien | E-Mails
Each tab fetches relevant data from respective APIs.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: projects, tasks, and time entries CRUD with detail page"
git push
```

---

### Task 8: Employees API + Page

**Files:**
- Create: `app/api/employees/route.ts`, `app/api/employees/[id]/route.ts`
- Create: `app/employees/page.tsx`

- [ ] **Step 1: Implement Employees API** (same pattern as customers — no test required separately, covered by integration)

- [ ] **Step 2: Write employees list page** with table showing name, role, email, phone. Form to create/edit.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: employees CRUD API and list page"
git push
```

---

## Phase 3: Dateiablage

**Goal:** Upload files, store on disk, serve via auth-protected API route, attach to projects/customers.

---

### Task 9: File Upload + Auth-Protected Download

**Files:**
- Create: `lib/files.ts`
- Create: `app/api/files/route.ts`
- Create: `app/api/files/[id]/download/route.ts`
- Create: `components/files/FileUploadZone.tsx`
- Create: `app/files/page.tsx`
- Test: `__tests__/api/files.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/api/files.test.ts
import { GET } from '@/app/api/files/[id]/download/route'

jest.mock('next-auth', () => ({ getServerSession: jest.fn().mockResolvedValue(null) }))
jest.mock('@/lib/prisma', () => ({ prisma: { file: { findUnique: jest.fn() } } }))

test('download without session returns 401', async () => {
  const req = new Request('http://localhost/api/files/abc/download')
  const res = await GET(req, { params: { id: 'abc' } })
  expect(res.status).toBe(401)
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern=files
```

- [ ] **Step 3: Write `lib/files.ts`**

```typescript
// lib/files.ts
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

export function getUploadPath(subdir: string, filename: string): string {
  return path.join(UPLOAD_DIR, subdir, filename)
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export function getSubdir(projectId?: string, customerId?: string): string {
  if (projectId) return `projects/${projectId}`
  if (customerId) return `customers/${customerId}`
  return 'misc'
}
```

- [ ] **Step 4: Write `app/api/files/route.ts`** (upload)

```typescript
// app/api/files/route.ts
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
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

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
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Dateityp nicht erlaubt' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Datei zu groß (max. 50MB)' }, { status: 400 })

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
```

- [ ] **Step 5: Write `app/api/files/[id]/download/route.ts`**

```typescript
// app/api/files/[id]/download/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUploadPath } from '@/lib/files'
import fs from 'fs'
import path from 'path'

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
```

- [ ] **Step 6: Run tests to verify pass**

```bash
npm test -- --testPathPattern=files
```
Expected: PASS

- [ ] **Step 7: Write `components/files/FileUploadZone.tsx`**

Drag-and-drop zone using native `ondragover`/`ondrop`. On drop, `POST /api/files` with `FormData`. Show progress via `XMLHttpRequest` or fetch. List uploaded files with download link and delete button.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: file upload and auth-protected download API"
git push
```

---

## Phase 4: E-Mail Integration

**Goal:** IMAP background worker syncing emails to DB, inbox UI, compose modal, email-to-project assignment.

---

### Task 10: IMAP Background Worker

**Files:**
- Create: `lib/email/imap.ts`
- Create: `lib/email/smtp.ts`
- Create: `worker/index.ts`

- [ ] **Step 1: Write `lib/email/imap.ts`**

```typescript
// lib/email/imap.ts
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
    // Fetch last 50 unseen messages
    for await (const msg of client.fetch('1:50', { envelope: true, bodyStructure: true, source: true })) {
      const messageId = msg.envelope.messageId
      if (!messageId) continue

      const exists = await prisma.email.findUnique({ where: { messageId } })
      if (exists) continue

      const rawBody = msg.source?.toString('utf-8') ?? ''
      // Extract plain text or HTML body (simplified — use mailparser for production)
      const htmlMatch = rawBody.match(/<html[\s\S]*?<\/html>/i)
      const body = htmlMatch
        ? sanitizeHtml(htmlMatch[0], { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']) })
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
```

- [ ] **Step 2: Write `lib/email/smtp.ts`**

```typescript
// lib/email/smtp.ts
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
```

- [ ] **Step 3: Write `worker/index.ts`**

```typescript
// worker/index.ts
import { syncInbox } from '../lib/email/imap'
import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

const IMAP_INTERVAL_MS = 2 * 60 * 1000        // 2 minutes
const DAILY_JOBS_HOUR = 6                       // 06:00
const BACKUP_HOUR = 3                           // 03:00
const MAX_BACKUPS = 30

let lastDailyRun = -1
let lastBackupRun = -1

async function runDailyJobs(): Promise<void> {
  // Mark overdue invoices
  const updated = await prisma.invoice.updateMany({
    where: {
      status: 'SENT',
      dueDate: { lt: new Date() },
    },
    data: { status: 'OVERDUE' },
  })
  if (updated.count > 0) console.log(`[worker] Marked ${updated.count} invoices as OVERDUE`)
}

async function runBackup(): Promise<void> {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') ?? './data/cms.db'
  const backupDir = process.env.BACKUP_DIR ?? './backups'
  fs.mkdirSync(backupDir, { recursive: true })

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const dest = path.join(backupDir, `cms-${today}.db`)
  fs.copyFileSync(dbPath, dest)
  console.log(`[worker] Backup written to ${dest}`)

  // Rotate: keep only last MAX_BACKUPS
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('cms-') && f.endsWith('.db'))
    .sort()
  for (const old of files.slice(0, -MAX_BACKUPS)) {
    fs.unlinkSync(path.join(backupDir, old))
    console.log(`[worker] Deleted old backup: ${old}`)
  }
}

async function tick(): Promise<void> {
  // IMAP sync
  try {
    const count = await syncInbox()
    if (count > 0) console.log(`[worker] Synced ${count} new emails`)
  } catch (err) {
    console.error('[worker] IMAP sync failed:', err)
  }

  // Daily jobs at DAILY_JOBS_HOUR
  const hour = new Date().getHours()
  if (hour === DAILY_JOBS_HOUR && lastDailyRun !== hour) {
    lastDailyRun = hour
    await runDailyJobs()
  }

  // Backup at BACKUP_HOUR
  if (hour === BACKUP_HOUR && lastBackupRun !== hour) {
    lastBackupRun = hour
    await runBackup()
  }
}

// Run immediately, then on interval
tick()
setInterval(tick, IMAP_INTERVAL_MS)
console.log('[worker] Started')
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: IMAP worker, SMTP send, background job scheduler"
git push
```

---

### Task 11: Email API + Inbox UI

**Files:**
- Create: `app/api/emails/route.ts`, `app/api/emails/[id]/route.ts`
- Create: `app/emails/page.tsx`
- Create: `components/emails/EmailList.tsx`, `ComposeModal.tsx`

- [ ] **Step 1: Write `app/api/emails/route.ts`**

```typescript
// GET: list (filter by direction, projectId, customerId, isRead)
// POST: send outgoing email via smtp.ts sendEmail()
```

- [ ] **Step 2: Write `app/api/emails/[id]/route.ts`**

```typescript
// GET: single email detail
// PUT: { isRead: true }, { projectId }, { customerId } (assign)
```

- [ ] **Step 3: Write inbox page**

Two-column layout: email list (left), email detail (right). Filter tabs: Alle | Eingang | Ausgang | Ungelesen. Mark as read on click. "Neues E-Mail" button opens `ComposeModal`.

- [ ] **Step 4: Write `ComposeModal`**

Fields: To (autocomplete from customers), Subject, Body (textarea). On submit: `POST /api/emails`. After send, close modal and refresh list.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: email inbox, compose, and assignment to projects/customers"
git push
```

---

## Phase 5: Fakturierung & Buchführung

**Goal:** Full Angebot → Rechnung → Payment → Journal workflow. Chart of accounts, balance sheet, P&L.

---

### Task 12: Invoicing API

**Files:**
- Create: `lib/accounting/skr03.ts`
- Create: `lib/accounting/journal.ts`
- Create: `app/api/invoices/route.ts`, `app/api/invoices/[id]/route.ts`
- Create: `app/api/invoices/[id]/convert/route.ts`
- Create: `app/api/payments/route.ts`
- Test: `__tests__/api/invoices.test.ts`, `__tests__/lib/journal.test.ts`

- [ ] **Step 1: Write failing journal test**

```typescript
// __tests__/lib/journal.test.ts
import { createPaymentJournalEntries } from '@/lib/accounting/journal'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    account: { findUniqueOrThrow: jest.fn() },
    journalEntry: { create: jest.fn() },
  },
}))

const { prisma } = require('@/lib/prisma')

test('createPaymentJournalEntries creates two entries for VAT split', async () => {
  prisma.account.findUniqueOrThrow
    .mockResolvedValueOnce({ id: 'bank-id' })    // 1200
    .mockResolvedValueOnce({ id: 'revenue-id' }) // 8400
    .mockResolvedValueOnce({ id: 'vat-id' })     // 1766

  prisma.journalEntry.create.mockResolvedValue({})

  await createPaymentJournalEntries({
    paymentId: 'pay1',
    invoiceId: 'inv1',
    total: 119,
    vatRate: 19,
    date: new Date('2026-03-22'),
  })

  expect(prisma.journalEntry.create).toHaveBeenCalledTimes(2)
})
```

- [ ] **Step 2: Run to verify failure, then implement**

- [ ] **Step 3: Write `lib/accounting/skr03.ts`**

```typescript
// lib/accounting/skr03.ts
export const SKR03 = {
  BANK: '1200',
  RECEIVABLES: '1400',
  VAT_19: '1766',
  VAT_7: '1771',
  REVENUE_19: '8400',
  REVENUE_7: '8300',
} as const
```

- [ ] **Step 4: Write `lib/accounting/journal.ts`**

```typescript
// lib/accounting/journal.ts
import { prisma } from '@/lib/prisma'
import { SKR03 } from './skr03'

export async function createPaymentJournalEntries(opts: {
  paymentId: string
  invoiceId: string
  total: number           // gross amount paid
  vatRate: number         // e.g. 19
  date: Date
}): Promise<void> {
  const { paymentId, invoiceId, total, vatRate, date } = opts
  const netAmount = total / (1 + vatRate / 100)
  const vatAmount = total - netAmount

  const bankAccount = await prisma.account.findUniqueOrThrow({ where: { number: SKR03.BANK } })
  const revenueAccount = await prisma.account.findUniqueOrThrow({
    where: { number: vatRate === 7 ? SKR03.REVENUE_7 : SKR03.REVENUE_19 },
  })
  const vatAccount = await prisma.account.findUniqueOrThrow({
    where: { number: vatRate === 7 ? SKR03.VAT_7 : SKR03.VAT_19 },
  })

  // Entry 1: Bank SOLL / Revenue HABEN (net)
  await prisma.journalEntry.create({
    data: {
      date, description: `Zahlungseingang Rechnung`,
      amount: netAmount,
      debitAccountId: bankAccount.id,
      creditAccountId: revenueAccount.id,
      invoiceId, paymentId,
    },
  })

  // Entry 2: Bank SOLL / VAT HABEN (VAT portion)
  await prisma.journalEntry.create({
    data: {
      date, description: `USt ${vatRate}% Zahlungseingang`,
      amount: vatAmount,
      debitAccountId: bankAccount.id,
      creditAccountId: vatAccount.id,
      invoiceId, paymentId,
    },
  })
}
```

- [ ] **Step 5: Run journal test to verify pass**

```bash
npm test -- --testPathPattern=journal
```

- [ ] **Step 6: Write `app/api/invoices/route.ts`**

```typescript
// GET: list invoices (filter by type, status, customerId)
// POST: create invoice with items
// Auto-generate invoice number: format "RE-2026-0001" (RECHNUNG) or "AN-2026-0001" (ANGEBOT)
```

- [ ] **Step 7: Write `app/api/invoices/[id]/convert/route.ts`**

```typescript
// POST: convert ANGEBOT → RECHNUNG
// Creates new Invoice with type=RECHNUNG, sourceOfferId=original.id
// Copies all InvoiceItems, assigns new RECHNUNG number
// Original stays as ANGEBOT (immutable)
```

- [ ] **Step 8: Write `app/api/payments/route.ts`**

```typescript
// POST body: { invoiceId, amount, date, method }
// 1. Create Payment record
// 2. Call createPaymentJournalEntries()
// 3. Update Invoice status to PAID if payment.amount >= invoice.total
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: invoicing API, payment booking, double-entry journal entries"
git push
```

---

### Task 13: Invoice UI + PDF Generation

**Files:**
- Create: `app/invoices/page.tsx`, `app/invoices/[id]/page.tsx`
- Create: `components/invoices/InvoiceForm.tsx`
- Create: `components/invoices/InvoicePDF.tsx`
- Create: `app/api/invoices/[id]/send/route.ts`

- [ ] **Step 1: Write `components/invoices/InvoicePDF.tsx`**

```tsx
// components/invoices/InvoicePDF.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 30 },
  title: { fontSize: 20, marginBottom: 4 },
  table: { marginTop: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingVertical: 4 },
  total: { marginTop: 10, alignItems: 'flex-end' },
})

export function InvoicePDF({ invoice }: { invoice: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {invoice.type === 'ANGEBOT' ? 'Angebot' : 'Rechnung'} {invoice.number}
          </Text>
          <Text>Datum: {new Date(invoice.date).toLocaleDateString('de-DE')}</Text>
          {invoice.dueDate && (
            <Text>Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}</Text>
          )}
        </View>
        <View>
          <Text style={{ fontWeight: 'bold' }}>{invoice.customer?.name}</Text>
          {invoice.customer?.address && <Text>{invoice.customer.address}</Text>}
        </View>
        <View style={styles.table}>
          {invoice.items.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={{ flex: 3 }}>{item.description}</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>{item.quantity}x</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>{item.unitPrice.toFixed(2)} €</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>{item.total.toFixed(2)} €</Text>
            </View>
          ))}
        </View>
        <View style={styles.total}>
          <Text>Netto: {invoice.subtotal.toFixed(2)} €</Text>
          <Text>MwSt. {invoice.vatRate}%: {invoice.vatAmount.toFixed(2)} €</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Gesamt: {invoice.total.toFixed(2)} €</Text>
        </View>
        {invoice.notes && <Text style={{ marginTop: 20, color: '#666' }}>{invoice.notes}</Text>}
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Write `app/api/invoices/[id]/send/route.ts`**

```typescript
// POST: generate PDF + send via email
// Uses renderToBuffer(InvoicePDF) from @react-pdf/renderer
// Sends via nodemailer with PDF attachment
// Creates OUT email record in DB
// Updates Invoice status to SENT
```

- [ ] **Step 3: Write Invoice list page** — table with columns: Nummer, Typ (Badge), Kunde, Datum, Fällig, Betrag, Status (Badge). Filter by type (Angebot/Rechnung) and status.

- [ ] **Step 4: Write Invoice detail page** — shows items, total, status. Action buttons: "Als Rechnung konvertieren" (if ANGEBOT), "PDF herunterladen", "Per E-Mail senden", "Zahlung erfassen" (form).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: invoice list/detail UI and PDF generation"
git push
```

---

### Task 14: Accounting Views

**Files:**
- Create: `app/api/accounts/route.ts`, `app/api/journal/route.ts`
- Create: `app/accounting/page.tsx` (Journal)
- Create: `app/accounting/accounts/page.tsx`
- Create: `app/accounting/balance/page.tsx`
- Create: `app/accounting/income/page.tsx`
- Create: `app/accounting/vat/page.tsx`

- [ ] **Step 1: Write `app/api/journal/route.ts`**

```typescript
// GET: all journal entries with account names, optional date range filter
// Returns { entries: JournalEntry[], totalDebit, totalCredit }
```

- [ ] **Step 2: Write `app/api/accounts/route.ts`**

```typescript
// GET: all accounts with running balance (sum of debit entries - sum of credit entries)
// POST: create new account
```

- [ ] **Step 3: Implement balance sheet endpoint**

Add `GET /api/accounts?view=balance`:
```typescript
// Group accounts by type
// AKTIV: sum of (debitEntries - creditEntries)
// PASSIV: sum of (creditEntries - debitEntries)
// Return { aktiva: Account[], totalAktiva, passiva: Account[], totalPassiva }
```

- [ ] **Step 4: Implement GuV endpoint**

Add `GET /api/accounts?view=income&year=2026`:
```typescript
// ERTRAG accounts summed = Gesamtertrag
// AUFWAND accounts summed = Gesamtaufwand
// Ergebnis = Ertrag - Aufwand
```

- [ ] **Step 5: Implement MwSt overview**

Add `GET /api/accounts?view=vat&quarter=1&year=2026`:
```typescript
// Sum entries on 1766 (VAT collected) for the quarter
// Sum entries on 1576 (input VAT) for the quarter
// Zahllast = collected - input
```

- [ ] **Step 6: Write accounting pages** — Journal as dense table (monospace font for amounts), Bilanz as two-column Aktiva/Passiva, GuV as Ertrag/Aufwand comparison, MwSt as quarterly summary.

- [ ] **Step 7: Write Mahnwesen action** — On overdue invoice detail page: "Mahnung senden" button. Generates Mahnschreiben-PDF (similar to InvoicePDF with "MAHNUNG" header), sends via email, saves File record with `invoiceId`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: accounting views — journal, Bilanz, GuV, MwSt, Mahnwesen"
git push
```

---

## Phase 6: Dashboard + Einstellungen + Final Polish

**Goal:** Dashboard widgets, settings page (IMAP/SMTP config), final integration test.

---

### Task 15: Dashboard API + Widgets

**Files:**
- Create: `app/api/dashboard/route.ts`
- Create: `app/page.tsx` (replace placeholder)

- [ ] **Step 1: Write `app/api/dashboard/route.ts`**

```typescript
// GET: aggregated data for all widgets
export async function GET() {
  const [openInvoices, activeProjects, unreadEmails, overdueTasks, recentEntries] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { total: true }, _count: true, where: { status: { in: ['SENT', 'OVERDUE'] } } }),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.email.count({ where: { isRead: false, direction: 'IN' } }),
    prisma.task.count({ where: { status: { not: 'DONE' }, dueDate: { lt: new Date() } } }),
    prisma.journalEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { debitAccount: true, creditAccount: true } }),
  ])
  return NextResponse.json({ openInvoices, activeProjects, unreadEmails, overdueTasks, recentEntries })
}
```

- [ ] **Step 2: Write `app/page.tsx`** — Grid of 4 stat cards + recent journal entries table.

```tsx
// Stat cards: Offene Rechnungen (sum + count), Aktive Projekte, Ungelesene E-Mails, Überfällige Aufgaben
// Each card links to relevant section
// Color coding: danger for overdue, gold for open invoices, blue for emails
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: dashboard with stats and recent journal entries"
git push
```

---

### Task 16: Settings Page + Final Wiring

**Files:**
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Write settings page**

Sections:
- **IMAP/SMTP:** Shows current env vars (masked), instructions to edit `.env.local`
- **Admin Passwort ändern:** Form that `PUT`s new bcrypt hash to a `PUT /api/auth/password` route
- **Datenbank:** Show DB file size, last backup date, manual backup button

- [ ] **Step 2: Wire file attachment in project detail tabs**

Ensure "Dateien" tab in project detail page uses `FileUploadZone` component with `projectId` prop, and lists files via `GET /api/files?projectId=xxx`.

- [ ] **Step 3: Wire email assignment in project detail tabs**

"E-Mails" tab: shows emails where `projectId` matches. Button "E-Mail zuordnen" opens a modal to search and assign an existing email.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Test Docker production build end-to-end**

```bash
docker compose build
docker compose up -d
# Visit https://localhost (or configured domain)
# Verify login, create customer, create project, upload file, check accounting
docker compose logs cms
docker compose logs cms-worker
```
Expected: no errors in logs.

- [ ] **Step 6: Final commit + push**

```bash
git add -A
git commit -m "feat: settings page, final integration wiring, Docker e2e verified"
git push
```

---

## Summary

| Phase | Tasks | Deliverable |
|---|---|---|
| 1 — Foundation | 1–5 | GitHub repo, Docker, auth, design system |
| 2 — CRM | 6–8 | Customers, projects, tasks, time tracking |
| 3 — Dateiablage | 9 | Secure file upload/download |
| 4 — E-Mail | 10–11 | IMAP worker, inbox, compose |
| 5 — Buchhaltung | 12–14 | Invoices, payments, journal, Bilanz, GuV |
| 6 — Dashboard | 15–16 | Dashboard, settings, final polish |

**Start:** `docker compose up -d` after filling in `.env.local`.
