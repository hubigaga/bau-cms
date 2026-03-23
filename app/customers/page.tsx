'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Table, Th, Td } from '@/components/ui/Table'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' })

  const load = () => fetch('/api/customers').then(r => r.json()).then(setCustomers)
  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', address: '', notes: '' })
    setOpen(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '', notes: c.notes ?? '' })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = editing ? `/api/customers/${editing.id}` : '/api/customers'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Kunden löschen?')) return
    await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">Kunden</h1>
        <Button onClick={openCreate}>Neuer Kunde</Button>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>E-Mail</Th>
            <Th>Telefon</Th>
            <Th>Adresse</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id} className="hover:bg-[#222830]">
              <Td><Link href={`/customers/${c.id}`} className="text-[#6b8fa3] hover:underline">{c.name}</Link></Td>
              <Td>{c.email ?? '—'}</Td>
              <Td>{c.phone ?? '—'}</Td>
              <Td>{c.address ?? '—'}</Td>
              <Td>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => openEdit(c)}>Bearbeiten</Button>
                  <Button variant="danger" onClick={() => handleDelete(c.id)}>Löschen</Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {customers.length === 0 && (
        <p className="text-center text-[#7a8694] text-sm py-8">Noch keine Kunden erfasst.</p>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Kunde bearbeiten' : 'Neuer Kunde'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input placeholder="E-Mail" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input placeholder="Telefon" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input placeholder="Adresse" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <Textarea placeholder="Notizen" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit">Speichern</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
