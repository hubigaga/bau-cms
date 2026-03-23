'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="p-6 text-[#7a8694]">Laden...</div>

  const stats = [
    {
      label: 'Offene Rechnungen',
      value: `${(data.openInvoices?._sum?.total ?? 0).toFixed(2)} €`,
      sub: `${data.openInvoices?._count ?? 0} Rechnungen`,
      href: '/invoices',
      color: 'text-[#c9a84c]',
    },
    {
      label: 'Aktive Projekte',
      value: data.activeProjects ?? 0,
      href: '/projects',
      color: 'text-[#6b8fa3]',
    },
    {
      label: 'Ungelesene E-Mails',
      value: data.unreadEmails ?? 0,
      href: '/emails',
      color: data.unreadEmails > 0 ? 'text-[#6b8fa3]' : 'text-[#7a8694]',
    },
    {
      label: 'Überfällige Aufgaben',
      value: data.overdueTasks ?? 0,
      href: '/projects',
      color: data.overdueTasks > 0 ? 'text-[#8b3a3a]' : 'text-[#7a8694]',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-[#d4d8dd] text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:border-[#6b8fa3] transition-colors cursor-pointer">
              <p className="text-[#7a8694] text-xs uppercase tracking-wide mb-2">{s.label}</p>
              <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-[#7a8694] text-xs mt-1">{s.sub}</p>}
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Letzte Buchungen</h2>
        {data.recentEntries?.length > 0 ? (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-[#7a8694] border-b border-[#2e3640]">
                <th className="text-left py-2">Datum</th>
                <th className="text-left py-2">Beschreibung</th>
                <th className="text-left py-2">Soll</th>
                <th className="text-left py-2">Haben</th>
                <th className="text-right py-2">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEntries.map((e: any) => (
                <tr key={e.id} className="border-b border-[#2e3640]">
                  <td className="py-1.5 text-[#7a8694]">{new Date(e.date).toLocaleDateString('de-DE')}</td>
                  <td className="py-1.5 text-[#d4d8dd]">{e.description}</td>
                  <td className="py-1.5 text-[#7a8694]">{e.debitAccount?.number}</td>
                  <td className="py-1.5 text-[#7a8694]">{e.creditAccount?.number}</td>
                  <td className="py-1.5 text-right text-[#c9a84c]">{e.amount.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[#7a8694] text-sm">Noch keine Buchungen.</p>
        )}
      </Card>
    </div>
  )
}
