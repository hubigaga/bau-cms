'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

const TYPE_VARIANT: Record<string, any> = {
  AKTIV: 'blue', PASSIV: 'gold', ERTRAG: 'success', AUFWAND: 'danger',
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  useEffect(() => { fetch('/api/accounts').then(r => r.json()).then(setAccounts) }, [])

  const grouped = ['AKTIV', 'PASSIV', 'ERTRAG', 'AUFWAND'].map(type => ({
    type,
    items: accounts.filter(a => a.type === type),
  }))

  return (
    <div className="p-6">
      <h1 className="text-[#d4d8dd] text-xl font-semibold mb-6">Kontenplan (SKR03)</h1>
      <div className="grid grid-cols-2 gap-4">
        {grouped.map(g => (
          <Card key={g.type}>
            <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3 flex items-center gap-2">
              <Badge variant={TYPE_VARIANT[g.type]}>{g.type}</Badge>
            </h2>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[#7a8694] border-b border-[#2e3640]">
                  <th className="text-left py-1">Konto</th>
                  <th className="text-left py-1">Bezeichnung</th>
                  <th className="text-right py-1">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map(a => (
                  <tr key={a.id} className="border-b border-[#2e3640]">
                    <td className="py-1 text-[#7a8694]">{a.number}</td>
                    <td className="py-1 text-[#d4d8dd]">{a.name}</td>
                    <td className="py-1 text-right text-[#c9a84c]">{a.balance.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  )
}
