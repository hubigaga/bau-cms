'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default function AccountingPage() {
  const [data, setData] = useState<any>({ entries: [], totalDebit: 0 })
  useEffect(() => { fetch('/api/journal').then(r => r.json()).then(setData) }, [])

  return (
    <div className="p-6">
      <h1 className="text-[#d4d8dd] text-xl font-semibold mb-6">Buchführung</h1>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { href: '/accounting', label: 'Journal', active: true },
          { href: '/accounting/accounts', label: 'Kontenplan' },
          { href: '/accounting/balance', label: 'Bilanz' },
          { href: '/accounting/income', label: 'GuV' },
          { href: '/accounting/vat', label: 'MwSt' },
        ].map(nav => (
          <Link key={nav.href} href={nav.href}
            className={`p-3 text-center text-sm border transition-colors ${
              nav.active
                ? 'border-[#6b8fa3] text-[#6b8fa3]'
                : 'border-[#2e3640] text-[#7a8694] hover:text-[#d4d8dd]'
            }`}>
            {nav.label}
          </Link>
        ))}
      </div>

      <Card>
        <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">
          Journal ({data.entries?.length ?? 0} Buchungen)
        </h2>
        <div className="overflow-x-auto">
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
              {data.entries?.map((e: any) => (
                <tr key={e.id} className="border-b border-[#2e3640] hover:bg-[#222830]">
                  <td className="py-1.5 text-[#7a8694]">{new Date(e.date).toLocaleDateString('de-DE')}</td>
                  <td className="py-1.5 text-[#d4d8dd]">{e.description}</td>
                  <td className="py-1.5 text-[#7a8694]">{e.debitAccount?.number} {e.debitAccount?.name}</td>
                  <td className="py-1.5 text-[#7a8694]">{e.creditAccount?.number} {e.creditAccount?.name}</td>
                  <td className="py-1.5 text-right text-[#c9a84c]">{e.amount.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.entries?.length === 0 && (
            <p className="text-center text-[#7a8694] text-sm py-8">Noch keine Buchungen.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
