'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'

export default function BalancePage() {
  const [data, setData] = useState<any>({ aktiva: [], passiva: [], totalAktiva: 0, totalPassiva: 0 })
  useEffect(() => { fetch('/api/accounts?view=balance').then(r => r.json()).then(setData) }, [])

  return (
    <div className="p-6">
      <h1 className="text-[#d4d8dd] text-xl font-semibold mb-6">Bilanz</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Aktiva</h2>
          <table className="w-full text-sm font-mono">
            <tbody>
              {data.aktiva?.map((a: any) => (
                <tr key={a.id} className="border-b border-[#2e3640]">
                  <td className="py-1.5 text-[#d4d8dd]">{a.number} {a.name}</td>
                  <td className="py-1.5 text-right text-[#c9a84c]">{a.balance.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-2 text-[#d4d8dd] font-medium">Summe Aktiva</td>
                <td className="pt-2 text-right text-[#d4d8dd] font-medium">{data.totalAktiva?.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </Card>
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Passiva</h2>
          <table className="w-full text-sm font-mono">
            <tbody>
              {data.passiva?.map((a: any) => (
                <tr key={a.id} className="border-b border-[#2e3640]">
                  <td className="py-1.5 text-[#d4d8dd]">{a.number} {a.name}</td>
                  <td className="py-1.5 text-right text-[#c9a84c]">{Math.abs(a.balance).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-2 text-[#d4d8dd] font-medium">Summe Passiva</td>
                <td className="pt-2 text-right text-[#d4d8dd] font-medium">{data.totalPassiva?.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>
    </div>
  )
}
