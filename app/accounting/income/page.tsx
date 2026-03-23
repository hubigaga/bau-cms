'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'

export default function IncomePage() {
  const [data, setData] = useState<any>({ ertrag: [], aufwand: [], gesamtErtrag: 0, gesamtAufwand: 0, ergebnis: 0 })
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetch(`/api/accounts?view=income&year=${year}`).then(r => r.json()).then(setData)
  }, [year])

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">Gewinn- und Verlustrechnung</h1>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="bg-[#1a1e24] border border-[#2e3640] text-[#d4d8dd] px-2 py-1 text-sm">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="text-[#4a7c59] text-xs uppercase tracking-wide mb-3">Erträge</h2>
          <table className="w-full text-sm font-mono">
            <tbody>
              {data.ertrag?.map((a: any) => (
                <tr key={a.id} className="border-b border-[#2e3640]">
                  <td className="py-1.5 text-[#d4d8dd]">{a.number} {a.name}</td>
                  <td className="py-1.5 text-right text-[#4a7c59]">{Math.abs(a.balance).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-2 text-[#d4d8dd] font-medium">Gesamterlöse</td>
                <td className="pt-2 text-right text-[#4a7c59] font-medium">{data.gesamtErtrag?.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </Card>
        <Card>
          <h2 className="text-[#8b3a3a] text-xs uppercase tracking-wide mb-3">Aufwand</h2>
          <table className="w-full text-sm font-mono">
            <tbody>
              {data.aufwand?.map((a: any) => (
                <tr key={a.id} className="border-b border-[#2e3640]">
                  <td className="py-1.5 text-[#d4d8dd]">{a.number} {a.name}</td>
                  <td className="py-1.5 text-right text-[#8b3a3a]">{a.balance.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-2 text-[#d4d8dd] font-medium">Gesamtaufwand</td>
                <td className="pt-2 text-right text-[#8b3a3a] font-medium">{data.gesamtAufwand?.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>
      <div className={`mt-4 p-4 border ${data.ergebnis >= 0 ? 'border-[#4a7c59]' : 'border-[#8b3a3a]'}`}>
        <div className="flex justify-between items-center">
          <span className="text-[#d4d8dd] font-semibold">Ergebnis {year}</span>
          <span className={`text-xl font-mono font-bold ${data.ergebnis >= 0 ? 'text-[#4a7c59]' : 'text-[#8b3a3a]'}`}>
            {data.ergebnis?.toFixed(2)} €
          </span>
        </div>
      </div>
    </div>
  )
}
