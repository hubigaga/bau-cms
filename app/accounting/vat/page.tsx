'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'

export default function VatPage() {
  const [data, setData] = useState<any>({ collected: 0, input: 0, zahllast: 0 })
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3))
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetch(`/api/accounts?view=vat&quarter=${quarter}&year=${year}`)
      .then(r => r.json()).then(setData)
  }, [quarter, year])

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">MwSt-Übersicht</h1>
        <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}
          className="bg-[#1a1e24] border border-[#2e3640] text-[#d4d8dd] px-2 py-1 text-sm">
          {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="bg-[#1a1e24] border border-[#2e3640] text-[#d4d8dd] px-2 py-1 text-sm">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-2">Umsatzsteuer (eingenommen)</h2>
          <p className="text-2xl font-mono text-[#8b3a3a]">{data.collected?.toFixed(2)} €</p>
        </Card>
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-2">Vorsteuer (bezahlt)</h2>
          <p className="text-2xl font-mono text-[#4a7c59]">{data.input?.toFixed(2)} €</p>
        </Card>
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-2">Zahllast Q{quarter}/{year}</h2>
          <p className={`text-2xl font-mono font-bold ${data.zahllast >= 0 ? 'text-[#8b3a3a]' : 'text-[#4a7c59]'}`}>
            {data.zahllast?.toFixed(2)} €
          </p>
        </Card>
      </div>
    </div>
  )
}
