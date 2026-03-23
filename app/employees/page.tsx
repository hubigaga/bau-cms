'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Table, Th, Td } from '@/components/ui/Table'

interface Employee {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' })

  const load = () => fetch('/api/employees').then(r => r.json()).then(setEmployees)
  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', role: '' })
    setOpen(true)
  }

  function openEdit(e: Employee) {
    setEditing(e)
    setForm({ name: e.name, email: e.email ?? '', phone: e.phone ?? '', role: e.role ?? '' })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = editing ? `/api/employees/${editing.id}` : '/api/employees'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Mitarbeiter löschen?')) return
    await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">Mitarbeiter</h1>
        <Button onClick={openCreate}>Neuer Mitarbeiter</Button>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Rolle</Th>
            <Th>E-Mail</Th>
            <Th>Telefon</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id} className="hover:bg-[#222830]">
              <Td>{emp.name}</Td>
              <Td>{emp.role ?? '—'}</Td>
              <Td>{emp.email ?? '—'}</Td>
              <Td>{emp.phone ?? '—'}</Td>
              <Td>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => openEdit(emp)}>Bearbeiten</Button>
                  <Button variant="danger" onClick={() => handleDelete(emp.id)}>Löschen</Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {employees.length === 0 && (
        <p className="text-center text-[#7a8694] text-sm py-8">Noch keine Mitarbeiter erfasst.</p>
      )}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input placeholder="Rolle (z.B. Maurer, Vorarbeiter)" value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          <Input placeholder="E-Mail" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input placeholder="Telefon" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit">Speichern</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
