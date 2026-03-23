'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  invoiceId: string
  onPaid: () => void
}

export function PaymentForm({ open, onClose, invoiceId, onPaid }: Props) {
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'Überweisung' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, invoiceId }),
    })
    setSaving(false)
    onClose()
    onPaid()
  }

  return (
    <Modal open={open} onClose={onClose} title="Zahlung erfassen">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Betrag (€) *"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          required
        />
        <Input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          required
        />
        <Select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
          <option>Überweisung</option>
          <option>Bar</option>
          <option>Lastschrift</option>
          <option>Sonstiges</option>
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Wird gespeichert...' : 'Zahlung buchen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
