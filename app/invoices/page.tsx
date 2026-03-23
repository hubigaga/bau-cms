'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Table, Th, Td } from '@/components/ui/Table'

const STATUS_VARIANT: Record<string, any> = {
  DRAFT: 'default', SENT: 'blue', PAID: 'success', OVERDUE: 'danger', CANCELLED: 'default',
}
const TYPE_VARIANT: Record<string, any> = {
  ANGEBOT: 'gold', RECHNUNG: 'blue', GUTSCHRIFT: 'default',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState({
    type: 'RECHNUNG', customerId: '', date: new Date().toISOString().slice(0, 10),
    dueDate: '', notes: '',
    items: [{ description: '', quantity: '1', unitPrice: '', vatRate: '19' }],
  })

  const load = () => {
    const params = typeFilter ? `?type=${typeFilter}` : ''
    fetch(`/api/invoices${params}`).then(r => r.json()).then(setInvoices)
  }
  useEffect(() => { load() }, [typeFilter])
  useEffect(() => { fetch('/api/customers').then(r => r.json()).then(setCustomers) }, [])

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: '1', unitPrice: '', vatRate: '19' }] }))
  }

  function updateItem(i: number, field: string, value: string) {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [field]: value }
      return { ...f, items }
    })
  }

  const subtotal = form.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice) || 0), 0)
  const vatAmount = subtotal * 0.19
  const total = subtotal + vatAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        items: form.items.map(i => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          vatRate: Number(i.vatRate),
        })),
      }),
    })
    setOpen(false)
    load()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">Angebote & Rechnungen</h1>
        <Button onClick={() => setOpen(true)}>Neu</Button>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'ANGEBOT', 'RECHNUNG'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`text-sm px-3 py-1 border transition-colors ${
              typeFilter === t ? 'border-[#6b8fa3] text-[#6b8fa3]' : 'border-[#2e3640] text-[#7a8694]'
            }`}>
            {t || 'Alle'}
          </button>
        ))}
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Nummer</Th>
            <Th>Typ</Th>
            <Th>Kunde</Th>
            <Th>Datum</Th>
            <Th>Betrag</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id} className="hover:bg-[#222830]">
              <Td>
                <Link href={`/invoices/${inv.id}`} className="text-[#6b8fa3] hover:underline">
                  {inv.number}
                </Link>
              </Td>
              <Td><Badge variant={TYPE_VARIANT[inv.type]}>{inv.type}</Badge></Td>
              <Td>{inv.customer?.name ?? '—'}</Td>
              <Td>{new Date(inv.date).toLocaleDateString('de-DE')}</Td>
              <Td className="font-mono">{inv.total?.toFixed(2)} €</Td>
              <Td><Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge></Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title="Neue Rechnung / Angebot">
        <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="RECHNUNG">Rechnung</option>
              <option value="ANGEBOT">Angebot</option>
              <option value="GUTSCHRIFT">Gutschrift</option>
            </Select>
            <Select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
              <option value="">Kunde *</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            <Input type="date" placeholder="Fällig" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="space-y-2">
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-4 gap-1">
                <Input className="col-span-2" placeholder="Beschreibung *" value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)} required />
                <Input type="number" placeholder="Menge" value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)} />
                <Input type="number" placeholder="Preis (€)" value={item.unitPrice}
                  onChange={e => updateItem(i, 'unitPrice', e.target.value)} required />
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addItem}>+ Position</Button>
          </div>
          <div className="text-right text-sm text-[#7a8694]">
            Netto: {subtotal.toFixed(2)} € | MwSt 19%: {vatAmount.toFixed(2)} € | <strong className="text-[#d4d8dd]">Gesamt: {total.toFixed(2)} €</strong>
          </div>
          <Textarea placeholder="Notizen" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit">Erstellen</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
