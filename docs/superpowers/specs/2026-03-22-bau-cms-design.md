# Bau-CMS — Design-Spezifikation

**Datum:** 2026-03-22
**Projekt:** CMS für kleines Bauunternehmen
**Status:** Genehmigt

---

## Überblick

Ein browserbasiertes CMS für einen Einzelnutzer (Inhaber eines kleinen Bauunternehmens), das Projektverwaltung, doppelte Buchführung, E-Mail-Integration und lokale Dateiablage in einer einzigen Next.js-Anwendung vereint.

---

## Architektur

### Stack

| Komponente | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Datenbank | SQLite via Prisma ORM |
| Auth | NextAuth.js (Username/Passwort, bcrypt) |
| E-Mail eingehend | imapflow (IMAP-Polling alle 2 Min.) |
| E-Mail ausgehend | nodemailer (SMTP) |
| PDF-Generierung | @react-pdf/renderer |
| Prozessmanagement | PM2 (2 Prozesse: Next.js + Worker) |
| Reverse Proxy | Caddy (bereits auf Server vorhanden) |

### Prozesse

Das System besteht aus **zwei PM2-Prozessen**:

1. **`cms`** — Next.js App auf Port 3000 (UI + API Routes)
2. **`cms-worker`** — `worker.ts` (separater Node.js-Prozess für Background-Jobs)

Der Worker ist verantwortlich für:
- IMAP-Polling alle 2 Minuten (neue E-Mails in DB speichern)
- OVERDUE-Check täglich um 06:00 Uhr (Rechnungen mit überschrittenem dueDate → Status OVERDUE)
- SQLite-Backup täglich um 03:00 Uhr (letzte 30 Backups behalten, ältere löschen)

Der Worker greift direkt auf die Prisma-DB zu und läuft unabhängig von Next.js.

### Deployment-Struktur

```
/root/bau-cms/
  app/              ← Next.js App Router (Pages + API Routes)
  worker/           ← worker.ts (PM2-Prozess für Background-Jobs)
  prisma/           ← Schema + Migrationen + seed.ts (SKR03)
  data/             ← cms.db (SQLite-Datenbank)
  uploads/          ← Lokale Dateiablage (nie als statische Assets!)
    projects/       ← Dateien nach Projekt-ID
    customers/      ← Dateien nach Kunden-ID
    misc/           ← Allgemeine Dateien
  backups/          ← SQLite-Backups (max. 30 Dateien, dann rotieren)
  public/           ← Statische Assets (keine Uploads hier)
  docs/             ← Dokumentation
```

### Dateizugriff & Sicherheit

`/uploads/` wird **nicht** als statisches Verzeichnis exponiert. Alle Dateien werden ausschließlich über die API-Route `GET /api/files/[id]/download` ausgeliefert, die zuerst die NextAuth-Session prüft. Caddy erhält keinen direkten Zugriff auf `/uploads/`.

### Backup-Strategie

- Worker führt täglich um 03:00 Uhr aus: `cp data/cms.db backups/cms-YYYYMMDD.db`
- Nach dem Backup werden Backups gelöscht, die älter als 30 Tage sind
- Retention: maximal 30 Backup-Dateien

---

## Datenmodell

### CRM & Projektverwaltung

```prisma
model Customer {
  id        String    @id @default(cuid())
  name      String
  address   String?
  email     String?
  phone     String?
  notes     String?
  createdAt DateTime  @default(now())
  projects  Project[]
  invoices  Invoice[]
  emails    Email[]
  files     File[]
}

model Employee {
  id          String      @id @default(cuid())
  name        String
  email       String?
  phone       String?
  role        String?
  projects    ProjectEmployee[]
  timeEntries TimeEntry[]
  tasks       Task[]
}

model Project {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      ProjectStatus @default(ACTIVE)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime  @default(now())
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id])
  employees   ProjectEmployee[]
  tasks       Task[]
  timeEntries TimeEntry[]
  files       File[]
  emails      Email[]
  invoices    Invoice[]
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  PAUSED
  CANCELLED
}

model ProjectEmployee {
  projectId  String
  employeeId String
  project    Project  @relation(fields: [projectId], references: [id])
  employee   Employee @relation(fields: [employeeId], references: [id])
  @@id([projectId, employeeId])
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  dueDate     DateTime?
  createdAt   DateTime   @default(now())
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id])
  assignedTo  String?
  employee    Employee?  @relation(fields: [assignedTo], references: [id])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

model TimeEntry {
  id          String   @id @default(cuid())
  hours       Float
  date        DateTime
  description String?
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
}
```

### Dateiablage

```prisma
model File {
  id         String   @id @default(cuid())
  filename   String
  path       String   // relativ zu /uploads/, z.B. "projects/abc123/plan.pdf"
  mimetype   String
  size       Int
  uploadedAt DateTime @default(now())
  projectId  String?
  project    Project?  @relation(fields: [projectId], references: [id])
  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id])
  invoiceId  String?
  invoice    Invoice?  @relation(fields: [invoiceId], references: [id])
}
```

### E-Mail

E-Mails werden als **sanitisiertes HTML** gespeichert (HTML-Mails) oder als Plain-Text (falls kein HTML-Teil vorhanden). Rendering im UI via `dangerouslySetInnerHTML` mit DOMPurify-Sanitization clientseitig.

```prisma
model Email {
  id         String        @id @default(cuid())
  subject    String
  fromAddr   String
  toAddr     String
  body       String        // sanitisiertes HTML oder Plain-Text
  bodyType   String        @default("text") // "html" | "text"
  direction  EmailDirection
  sentAt     DateTime
  isRead     Boolean       @default(false)
  messageId  String?       @unique
  projectId  String?
  project    Project?      @relation(fields: [projectId], references: [id])
  customerId String?
  customer   Customer?     @relation(fields: [customerId], references: [id])
}

enum EmailDirection {
  IN
  OUT
}
```

### Doppelte Buchführung (SKR03-basiert)

```prisma
model Account {
  id            String      @id @default(cuid())
  number        String      @unique   // z.B. "1200" (Bank)
  name          String
  type          AccountType
  debitEntries  JournalEntry[] @relation("DebitAccount")
  creditEntries JournalEntry[] @relation("CreditAccount")
}

enum AccountType {
  AKTIV
  PASSIV
  ERTRAG
  AUFWAND
}

model JournalEntry {
  id              String   @id @default(cuid())
  date            DateTime
  description     String
  amount          Float
  debitAccountId  String
  debitAccount    Account  @relation("DebitAccount", fields: [debitAccountId], references: [id])
  creditAccountId String
  creditAccount   Account  @relation("CreditAccount", fields: [creditAccountId], references: [id])
  invoiceId       String?
  invoice         Invoice? @relation("InvoiceJournalEntries", fields: [invoiceId], references: [id])
  paymentId       String?
  payment         Payment? @relation(fields: [paymentId], references: [id])
  createdAt       DateTime @default(now())
}

model Invoice {
  id              String        @id @default(cuid())
  type            InvoiceType
  number          String        @unique
  date            DateTime
  dueDate         DateTime?
  status          InvoiceStatus @default(DRAFT)
  subtotal        Float
  vatRate         Float         @default(19)
  vatAmount       Float
  total           Float
  notes           String?
  sourceOfferId   String?       // gesetzt wenn aus Angebot konvertiert
  sourceOffer     Invoice?      @relation("OfferToInvoice", fields: [sourceOfferId], references: [id])
  convertedInvoice Invoice[]    @relation("OfferToInvoice")
  customerId      String
  customer        Customer      @relation(fields: [customerId], references: [id])
  projectId       String?
  project         Project?      @relation(fields: [projectId], references: [id])
  items           InvoiceItem[]
  payments        Payment[]
  journalEntries  JournalEntry[] @relation("InvoiceJournalEntries")
  files           File[]
  createdAt       DateTime      @default(now())
}

enum InvoiceType {
  ANGEBOT
  RECHNUNG
  GUTSCHRIFT
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

model InvoiceItem {
  id          String  @id @default(cuid())
  description String
  quantity    Float
  unitPrice   Float
  total       Float   // quantity * unitPrice, gespeichert zur Unveränderlichkeit
  vatRate     Float?  // falls abweichend vom Rechnungs-vatRate (z.B. 7%)
  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId], references: [id])
}

model Payment {
  id             String         @id @default(cuid())
  amount         Float
  date           DateTime
  method         String?
  invoiceId      String
  invoice        Invoice        @relation(fields: [invoiceId], references: [id])
  journalEntries JournalEntry[] // Buchungssatz der durch diese Zahlung erzeugt wurde
}
```

### SKR03-Seed

`prisma/seed.ts` lädt einen SKR03-Mindestkontenplan (ca. 30 Kernkonten) beim ersten `prisma db seed`. Wichtige Konten: 1200 (Bank), 1600 (Forderungen), 3400 (Verbindlichkeiten), 8400 (Erlöse 19%), 8300 (Erlöse 7%), 4... (Aufwandskonten). Der Kontenplan ist im System erweiterbar.

---

## Module & Navigation

### Sidebar-Navigation

```
📋 Dashboard
🏚 Projekte
👥 Kunden
👷 Mitarbeiter
📄 Angebote & Rechnungen
📒 Buchführung
📧 E-Mails
📁 Dateien
⚙️  Einstellungen
```

### Dashboard

Übersicht mit Widgets:
- Offene Rechnungen (Summe + Anzahl)
- Laufende Projekte
- Ungelesene E-Mails
- Überfällige Aufgaben
- Letzte Buchungen

### Projekte

- Listenansicht mit Filter (Status, Kunde, Zeitraum)
- Detailseite: Stammdaten, Aufgaben (Kanban-ähnlich), Zeiterfassung, zugeordnete Dateien, zugeordnete E-Mails

### Buchhaltung

- **Kontenplan:** SKR03 vorgeladen via Seed, erweiterbar
- **Journal:** Alle Buchungssätze chronologisch
- **Bilanz:** Aktiva/Passiva-Gegenüberstellung
- **GuV:** Erträge vs. Aufwendungen
- **MwSt-Übersicht:** Übersicht pro Quartal

### Rechnungs-Workflow

```
Angebot erstellen (type=ANGEBOT)
    → Als Rechnung konvertieren:
        - Neue Invoice (type=RECHNUNG, sourceOfferId=original.id)
        - Neue Rechnungsnummer zugewiesen
        - Original-Angebot bleibt unverändert
    → PDF generieren
    → Per E-Mail senden (öffnet Compose-Dialog vorausgefüllt)
    → Zahlungseingang buchen:
        - Payment-Eintrag erstellen
        - Automatischer JournalEntry:
          SOLL: 1200 Bank / HABEN: 8400 Erlöse (netto)
          SOLL: 1200 Bank / HABEN: 1766 MwSt (MwSt-Anteil)
        - Payment.journalEntries verknüpft
        - Rechnungsstatus → PAID
```

### Mahnwesen

- Worker prüft täglich: alle SENT-Rechnungen mit `dueDate < heute` → Status OVERDUE
- Mahnung per Knopfdruck: generiert Mahnschreiben-PDF (via @react-pdf/renderer), sendet per E-Mail
- Mahnschreiben-PDF wird als File-Eintrag mit `invoiceId` gespeichert

### E-Mail-Integration

- **IMAP-Polling:** Worker alle 2 Minuten, neue Mails via `messageId` dedupliziert
- **Posteingang:** alle empfangenen Mails, filterbar
- **Compose:** neues Mail aus dem System, Empfänger aus Kundenstamm wählbar
- **Zuordnung:** Mail einem Projekt oder Kunden zuordnen

### Dateiablage

- Upload via Drag & Drop (API Route: `POST /api/files`)
- Auslieferung nur via `GET /api/files/[id]/download` (Auth-Check)
- Vorschau für Bilder und PDFs
- Filter nach Projekt/Kunde/Typ
- Max. 50MB pro Datei, Dateityp-Whitelist serverseitig

---

## Design-System

### Farben (Dark Industrial Theme)

| Token | Wert | Verwendung |
|---|---|---|
| `bg-base` | `#0f1114` | Seiten-Hintergrund |
| `bg-surface` | `#1a1e24` | Karten, Panels |
| `bg-elevated` | `#222830` | Hover, aktive Elemente |
| `border` | `#2e3640` | Trennlinien, Rahmen |
| `text-primary` | `#d4d8dd` | Haupttext |
| `text-muted` | `#7a8694` | Sekundärtext |
| `accent-blue` | `#6b8fa3` | Links, aktive Nav |
| `accent-gold` | `#c9a84c` | CTAs, Highlights |
| `success` | `#4a7c59` | Bezahlt, Erledigt |
| `danger` | `#8b3a3a` | Überfällig, Fehler |

### Typografie

- **UI-Text:** Inter (sans-serif)
- **Zahlen/Beträge:** JetBrains Mono (monospace, tabellarisch ausgerichtet)

### Design-Prinzipien

- Scharfe Kanten (kein border-radius > 4px)
- Subtile Texturen auf Surfaces (gebürstetes Metall)
- Konservative Icon-Nutzung (Lucide Icons)
- Tabellen für Buchungen/Rechnungen: dense, monospace Zahlen

---

## Sicherheit

- NextAuth.js Session-basierte Auth via `middleware.ts` (schützt alle Routen außer `/api/auth/*`)
- Datei-Downloads: zusätzlicher `getServerSession()`-Check in der Route selbst
- `/uploads/` ist kein statisches Verzeichnis, wird nicht von Caddy exponiert
- Passwort in DB: bcrypt (cost factor 12)
- File-Upload: Typ-Whitelist + 50MB-Größenlimit serverseitig
- IMAP/SMTP-Credentials in `.env.local` (nie im Code oder Git)
- E-Mail-Body: serverseitig via `sanitize-html` bereinigt vor DB-Speicherung

---

## Nicht im Scope (bewusste Vereinfachungen)

- Keine Mehrbenutzer-Unterstützung
- Kein DATEV-Export (kann später ergänzt werden)
- Kein Bankkonto-Abgleich
- Keine Mobile-App
- Kein Gantt-Diagramm / Ressourcenplanung
