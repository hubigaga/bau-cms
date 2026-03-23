'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PaymentForm } from '@/components/invoices/PaymentForm'

const STATUS_VARIANT: Record<string, any> = {
  DRAFT: 'default', SENT: 'blue', PAID: 'success', OVERDUE: 'danger', CANCELLED: 'default',
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [converting, setConverting] = useState(false)
  const [sending, setSending] = useState(false)

  const load = () => fetch(`/api/invoices/${id}`).then(r => r.json()).then(setInvoice)
  useEffect(() => { load() }, [id])

  async function convert() {
    setConverting(true)
    const res = await fetch(`/api/invoices/${id}/convert`, { method: 'POST' })
    const data = await res.json()
    setConverting(false)
    router.push(`/invoices/${data.id}`)
  }

  async function sendInvoice() {
    setSending(true)
    await fetch(`/api/invoices/${id}/send`, { method: 'POST' })
    setSending(false)
    load()
  }

  if (!invoice) return <div className="p-6 text-[#7a8694]">Laden...</div>

  const paidAmount = invoice.payments?.reduce((s: number, p: any) => s + p.amount, 0) ?? 0
  const remaining = invoice.total - paidAmount

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-[#d4d8dd] text-xl font-semibold">{invoice.number}</h1>
          <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
          <Badge variant={invoice.type === 'ANGEBOT' ? 'gold' : 'blue'}>{invoice.type}</Badge>
        </div>
        <div className="flex gap-2">
          {invoice.type === 'ANGEBOT' && invoice.status !== 'CANCELLED' && (
            <Button variant="secondary" onClick={convert} disabled={converting}>
              {converting ? '...' : 'Als Rechnung konvertieren'}
            </Button>
          )}
          <a href={`/api/invoices/${id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">PDF herunterladen</Button>
          </a>
          {invoice.type === 'RECHNUNG' && invoice.status === 'DRAFT' && (
            <Button onClick={sendInvoice} disabled={sending}>
              {sending ? 'Wird gesendet...' : 'Per E-Mail senden'}
            </Button>
          )}
          {invoice.type === 'RECHNUNG' && ['SENT', 'OVERDUE'].includes(invoice.status) && (
            <Button onClick={() => setPaymentOpen(true)}>Zahlung erfassen</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Details</h2>
          <div className="space-y-1 text-sm text-[#d4d8dd]">
            <p>Kunde: {invoice.customer?.name}</p>
            <p>Datum: {new Date(invoice.date).toLocaleDateString('de-DE')}</p>
            {invoice.dueDate && <p>Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}</p>}
            {invoice.project && <p>Projekt: {invoice.project.title}</p>}
          </div>
        </Card>
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Beträge</h2>
          <div className="space-y-1 text-sm font-mono">
            <div className="flex justify-between text-[#7a8694]">
              <span>Netto</span><span>{invoice.subtotal?.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-[#7a8694]">
              <span>MwSt. {invoice.vatRate}%</span><span>{invoice.vatAmount?.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-[#d4d8dd] font-medium border-t border-[#2e3640] pt-1">
              <span>Gesamt</span><span>{invoice.total?.toFixed(2)} €</span>
            </div>
            {paidAmount > 0 && (
              <>
                <div className="flex justify-between text-[#4a7c59]">
                  <span>Bezahlt</span><span>{paidAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-[#c9a84c]">
                  <span>Offen</span><span>{remaining.toFixed(2)} €</span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Positionen</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#7a8694] text-xs">
              <th className="text-left pb-2">Beschreibung</th>
              <th className="text-right pb-2">Menge</th>
              <th className="text-right pb-2">Einzelpreis</th>
              <th className="text-right pb-2">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any) => (
              <tr key={item.id} className="border-t border-[#2e3640]">
                <td className="py-2 text-[#d4d8dd]">{item.description}</td>
                <td className="py-2 text-right text-[#7a8694] font-mono">{item.quantity}</td>
                <td className="py-2 text-right text-[#7a8694] font-mono">{item.unitPrice.toFixed(2)} €</td>
                <td className="py-2 text-right text-[#d4d8dd] font-mono">{item.total.toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {invoice.notes && (
        <Card>
          <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-2">Notizen</h2>
          <p className="text-sm text-[#d4d8dd]">{invoice.notes}</p>
        </Card>
      )}

      <PaymentForm
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        invoiceId={invoice.id}
        onPaid={load}
      />
    </div>
  )
}
