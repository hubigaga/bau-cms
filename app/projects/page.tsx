'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'

interface Project {
  id: string
  title: string
  status: string
  customer?: { name: string }
}

const STATUS_VARIANT: Record<string, any> = {
  ACTIVE: 'success', COMPLETED: 'default', PAUSED: 'gold', CANCELLED: 'danger',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ title: '', customerId: '', description: '', startDate: '', endDate: '' })

  const load = () => fetch('/api/projects').then(r => r.json()).then(setProjects)
  useEffect(() => {
    load()
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setOpen(false)
    load()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">Projekte</h1>
        <Button onClick={() => setOpen(true)}>Neues Projekt</Button>
      </div>
      <div className="space-y-2">
        {projects.map(p => (
          <Link key={p.id} href={`/projects/${p.id}`}
            className="flex items-center justify-between p-4 bg-[#1a1e24] border border-[#2e3640] hover:border-[#6b8fa3] transition-colors">
            <div>
              <span className="text-[#d4d8dd] font-medium">{p.title}</span>
              {p.customer && (
                <span className="text-[#7a8694] text-sm ml-3">{p.customer.name}</span>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[p.status] ?? 'default'}>{p.status}</Badge>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="text-center text-[#7a8694] text-sm py-8">Noch keine Projekte erfasst.</p>
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Neues Projekt">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Titel *" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Select value={form.customerId}
            onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
            <option value="">Kunde wählen *</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input placeholder="Beschreibung" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            <Input type="date" value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit">Erstellen</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
