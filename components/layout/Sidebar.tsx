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
