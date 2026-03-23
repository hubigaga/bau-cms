'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onSent: () => void
  defaultTo?: string
  projectId?: string
  customerId?: string
}

export function ComposeModal({ open, onClose, onSent, defaultTo, projectId, customerId }: Props) {
  const [form, setForm] = useState({ to: defaultTo ?? '', subject: '', body: '' })
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    await fetch('/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, projectId, customerId }),
    })
    setSending(false)
    onClose()
    onSent()
  }

  return (
    <Modal open={open} onClose={onClose} title="Neue E-Mail">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="An *"
          type="email"
          value={form.to}
          onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
          required
        />
        <Input
          placeholder="Betreff *"
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          required
        />
        <Textarea
          placeholder="Nachricht *"
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          rows={8}
          required
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" disabled={sending}>
            {sending ? 'Wird gesendet...' : 'Senden'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
