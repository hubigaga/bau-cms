'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { TaskBoard } from '@/components/projects/TaskBoard'

const TABS = ['Übersicht', 'Aufgaben', 'Zeiterfassung', 'Dateien', 'E-Mails']
const STATUS_VARIANT: Record<string, any> = {
  ACTIVE: 'success', COMPLETED: 'default', PAUSED: 'gold', CANCELLED: 'danger',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [tab, setTab] = useState('Übersicht')
  const [tasks, setTasks] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [taskOpen, setTaskOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '' })
  const [timeForm, setTimeForm] = useState({ employeeId: '', hours: '', date: '', description: '' })

  const loadProject = () =>
    fetch(`/api/projects/${id}`).then(r => r.json()).then((p: any) => {
      setProject(p)
      setTasks(p.tasks ?? [])
      setTimeEntries(p.timeEntries ?? [])
    })

  useEffect(() => {
    loadProject()
    fetch('/api/employees').then(r => r.json()).then(setEmployees)
  }, [id])

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskForm, projectId: id }),
    })
    setTaskOpen(false)
    loadProject()
  }

  async function addTimeEntry(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...timeForm, projectId: id }),
    })
    setTimeOpen(false)
    loadProject()
  }

  if (!project) return <div className="p-6 text-[#7a8694]">Laden...</div>

  const totalHours = timeEntries.reduce((sum: number, e: any) => sum + e.hours, 0)

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">{project.title}</h1>
        <Badge variant={STATUS_VARIANT[project.status]}>{project.status}</Badge>
        {project.customer && (
          <span className="text-[#7a8694] text-sm">{project.customer.name}</span>
        )}
      </div>

      <div className="flex border-b border-[#2e3640] mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === t
                ? 'text-[#6b8fa3] border-b-2 border-[#6b8fa3]'
                : 'text-[#7a8694] hover:text-[#d4d8dd]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Übersicht' && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Details</h2>
            <div className="space-y-1 text-sm text-[#d4d8dd]">
              {project.description && <p>{project.description}</p>}
              {project.startDate && (
                <p>Start: {new Date(project.startDate).toLocaleDateString('de-DE')}</p>
              )}
              {project.endDate && (
                <p>Ende: {new Date(project.endDate).toLocaleDateString('de-DE')}</p>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-3">Statistiken</h2>
            <div className="space-y-1 text-sm text-[#d4d8dd]">
              <p>Aufgaben: {tasks.length} ({tasks.filter((t: any) => t.status === 'DONE').length} erledigt)</p>
              <p>Stunden: {totalHours.toFixed(1)} h</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'Aufgaben' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setTaskOpen(true)}>Aufgabe hinzufügen</Button>
          </div>
          <TaskBoard tasks={tasks} onUpdate={loadProject} />
        </div>
      )}

      {tab === 'Zeiterfassung' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[#7a8694] text-sm">Gesamt: {totalHours.toFixed(1)} h</span>
            <Button onClick={() => setTimeOpen(true)}>Zeit erfassen</Button>
          </div>
          <div className="space-y-2">
            {timeEntries.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-[#1a1e24] border border-[#2e3640]">
                <div>
                  <span className="text-sm text-[#d4d8dd]">{e.employee?.name ?? '—'}</span>
                  {e.description && (
                    <span className="text-xs text-[#7a8694] ml-2">{e.description}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-[#c9a84c]">{e.hours}h</span>
                  <span className="text-xs text-[#7a8694] ml-2">
                    {new Date(e.date).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Dateien' && (
        <div className="text-[#7a8694] text-sm">Dateiablage folgt.</div>
      )}

      {tab === 'E-Mails' && (
        <div className="text-[#7a8694] text-sm">E-Mail-Integration folgt.</div>
      )}

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Aufgabe hinzufügen">
        <form onSubmit={addTask} className="space-y-3">
          <Input placeholder="Titel *" value={taskForm.title}
            onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required />
          <Input placeholder="Beschreibung" value={taskForm.description}
            onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
          <Select value={taskForm.assignedTo}
            onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))}>
            <option value="">Mitarbeiter (optional)</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Input type="date" value={taskForm.dueDate}
            onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setTaskOpen(false)}>Abbrechen</Button>
            <Button type="submit">Hinzufügen</Button>
          </div>
        </form>
      </Modal>

      <Modal open={timeOpen} onClose={() => setTimeOpen(false)} title="Zeit erfassen">
        <form onSubmit={addTimeEntry} className="space-y-3">
          <Select value={timeForm.employeeId}
            onChange={e => setTimeForm(f => ({ ...f, employeeId: e.target.value }))} required>
            <option value="">Mitarbeiter *</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Input type="number" step="0.5" min="0.5" placeholder="Stunden *" value={timeForm.hours}
            onChange={e => setTimeForm(f => ({ ...f, hours: e.target.value }))} required />
          <Input type="date" value={timeForm.date}
            onChange={e => setTimeForm(f => ({ ...f, date: e.target.value }))} required />
          <Input placeholder="Beschreibung" value={timeForm.description}
            onChange={e => setTimeForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setTimeOpen(false)}>Abbrechen</Button>
            <Button type="submit">Speichern</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
