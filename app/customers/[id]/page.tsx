'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

const STATUS_VARIANT: Record<string, any> = { ACTIVE: 'success', COMPLETED: 'default', PAUSED: 'gold', CANCELLED: 'danger' }

export default function CustomerDetailPage() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => r.json()).then(setCustomer)
  }, [id])

  if (!customer) return <div className="p-6 text-[#7a8694]">Laden...</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-[#d4d8dd] text-xl font-semibold">{customer.name}</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Kontaktdaten</h2>
          <div className="space-y-1 text-sm text-[#d4d8dd]">
            {customer.email && <p>✉ {customer.email}</p>}
            {customer.phone && <p>☎ {customer.phone}</p>}
            {customer.address && <p>📍 {customer.address}</p>}
          </div>
        </Card>
        {customer.notes && (
          <Card>
            <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Notizen</h2>
            <p className="text-sm text-[#d4d8dd]">{customer.notes}</p>
          </Card>
        )}
      </div>
      <Card>
        <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">
          Projekte ({customer.projects?.length ?? 0})
        </h2>
        <div className="space-y-2">
          {customer.projects?.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`}
              className="flex items-center justify-between p-2 hover:bg-[#222830] rounded">
              <span className="text-sm text-[#d4d8dd]">{p.title}</span>
              <Badge variant={STATUS_VARIANT[p.status] ?? 'default'}>{p.status}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
