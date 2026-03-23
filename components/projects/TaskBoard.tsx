'use client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const COLUMNS = [
  { status: 'TODO', label: 'Offen', variant: 'default' as const },
  { status: 'IN_PROGRESS', label: 'In Arbeit', variant: 'blue' as const },
  { status: 'DONE', label: 'Erledigt', variant: 'success' as const },
]

const NEXT_STATUS: Record<string, string> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
  employee?: { name: string } | null
}

export function TaskBoard({ tasks, onUpdate }: { tasks: Task[]; onUpdate: () => void }) {
  async function moveTask(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: NEXT_STATUS[task.status] }),
    })
    onUpdate()
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {COLUMNS.map(col => (
        <div key={col.status} className="bg-[#1a1e24] border border-[#2e3640] p-3">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={col.variant}>{col.label}</Badge>
            <span className="text-[#7a8694] text-xs">
              {tasks.filter(t => t.status === col.status).length}
            </span>
          </div>
          <div className="space-y-2">
            {tasks.filter(t => t.status === col.status).map(task => (
              <div key={task.id} className="bg-[#222830] p-2 border border-[#2e3640]">
                <p className="text-sm text-[#d4d8dd]">{task.title}</p>
                {task.employee && (
                  <p className="text-xs text-[#7a8694] mt-1">{task.employee.name}</p>
                )}
                {task.dueDate && (
                  <p className="text-xs text-[#7a8694]">
                    {new Date(task.dueDate).toLocaleDateString('de-DE')}
                  </p>
                )}
                <Button
                  variant="secondary"
                  className="mt-2 text-xs py-1 px-2"
                  onClick={() => moveTask(task)}
                >
                  → {NEXT_STATUS[task.status]}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
