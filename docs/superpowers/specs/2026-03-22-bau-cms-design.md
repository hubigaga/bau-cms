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
| Prozessmanagement | PM2 |
| Reverse Proxy | Caddy (bereits auf Server vorhanden) |

### Deployment-Struktur

```
/root/bau-cms/
  app/              ← Next.js App Router (Pages + API Routes)
  prisma/           ← Schema + Migrationen
  data/             ← cms.db (SQLite-Datenbank)
  uploads/          ← Lokale Dateiablage
    projects/       ← Dateien nach Projekt-ID
    customers/      ← Dateien nach Kunden-ID
    misc/           ← Allgemeine Dateien
  public/           ← Statische Assets
  docs/             ← Dokumentation
```

### Deployment

- Next.js läuft als PM2-Prozess auf Port 3000
- Caddy terminiert HTTPS und proxied auf Port 3000
- SQLite-Backup: täglicher Cron-Job (`cp data/cms.db backups/cms-$(date +%Y%m%d).db`)

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
  path       String
  mimetype   String
  size       Int
  uploadedAt DateTime @default(now())
  projectId  String?
  project    Project?  @relation(fields: [projectId], references: [id])
  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id])
}
```

### E-Mail

```prisma
model Email {
  id         String        @id @default(cuid())
  subject    String
  fromAddr   String
  toAddr     String
  body       String
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
  invoice         Invoice? @relation(fields: [invoiceId], references: [id])
  createdAt       DateTime @default(now())
}

model Invoice {
  id            String        @id @default(cuid())
  type          InvoiceType
  number        String        @unique
  date          DateTime
  dueDate       DateTime?
  status        InvoiceStatus @default(DRAFT)
  subtotal      Float
  vatRate       Float         @default(19)
  vatAmount     Float
  total         Float
  notes         String?
  customerId    String
  customer      Customer      @relation(fields: [customerId], references: [id])
  projectId     String?
  project       Project?      @relation(fields: [projectId], references: [id])
  items         InvoiceItem[]
  payments      Payment[]
  journalEntries JournalEntry[]
  createdAt     DateTime      @default(now())
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
  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId], references: [id])
}

model Payment {
  id        String   @id @default(cuid())
  amount    Float
  date      DateTime
  method    String?
  invoiceId String
  invoice   Invoice  @relation(fields: [invoiceId], references: [id])
}
```

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

- **Kontenplan:** SKR03 vorgeladen, anpassbar
- **Journal:** Alle Buchungssätze chronologisch
- **Bilanz:** Aktiva/Passiva-Gegenüberstellung
- **GuV:** Erträge vs. Aufwendungen
- **MwSt-Übersicht:** Übersicht pro Quartal

### Rechnungs-Workflow

```
Angebot erstellen
    → Als Rechnung markieren (Angebotsnummer → Rechnungsnummer)
    → PDF generieren
    → Per E-Mail senden (öffnet Compose-Dialog vorausgefüllt)
    → Zahlungseingang buchen
        → Automatischer Buchungssatz:
           SOLL: 1200 Bank / HABEN: 8400 Erlöse
        → Rechnungsstatus → PAID
```

### Mahnwesen

- Automatische Markierung als OVERDUE wenn dueDate überschritten
- Mahnung per Knopfdruck: generiert Mahnschreiben-PDF, sendet per E-Mail

### E-Mail-Integration

- **IMAP-Polling:** alle 2 Minuten via Background-Worker
- **Posteingang:** alle empfangenen Mails, filterbar
- **Compose:** neues Mail aus dem System, Empfänger aus Kundenstamm wählbar
- **Zuordnung:** Mail einem Projekt oder Kunden zuordnen (bleibt dann in der Detailansicht sichtbar)

### Dateiablage

- Upload via Drag & Drop
- Vorschau für Bilder und PDFs
- Filter nach Projekt/Kunde/Typ
- Max. 50MB pro Datei
- Dateityp-Validierung serverseitig

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

- NextAuth.js Session-basierte Auth
- Alle API-Routes prüfen Session via Middleware
- Passwort in DB: bcrypt (cost factor 12)
- File-Upload: Typ-Whitelist + Größenlimit serverseitig
- IMAP/SMTP-Credentials in `.env.local` (nie im Code)

---

## Nicht im Scope (bewusste Vereinfachungen)

- Keine Mehrbenutzer-Unterstützung
- Kein DATEV-Export (kann später ergänzt werden)
- Kein Bankkonto-Abgleich
- Keine Mobile-App
- Kein Gantt-Diagramm / Ressourcenplanung
