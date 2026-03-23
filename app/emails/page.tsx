'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmailList } from '@/components/emails/EmailList'
import { ComposeModal } from '@/components/emails/ComposeModal'

const FILTERS = [
  { label: 'Alle', params: '' },
  { label: 'Eingang', params: '?direction=IN' },
  { label: 'Ausgang', params: '?direction=OUT' },
  { label: 'Ungelesen', params: '?isRead=false' },
]

export default function EmailsPage() {
  const [emails, setEmails] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null)
  const [filter, setFilter] = useState(0)
  const [composeOpen, setComposeOpen] = useState(false)

  const load = () =>
    fetch(`/api/emails${FILTERS[filter].params}`)
      .then(r => r.json())
      .then(setEmails)

  useEffect(() => { load() }, [filter])

  async function selectEmail(id: string) {
    setSelected(id)
    const data = await fetch(`/api/emails/${id}`).then(r => r.json())
    setSelectedEmail(data)
    if (!data.isRead) {
      await fetch(`/api/emails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      load()
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">E-Mails</h1>
        <Button onClick={() => setComposeOpen(true)}>Neue E-Mail</Button>
      </div>

      <div className="flex gap-4 mb-4">
        {FILTERS.map((f, i) => (
          <button
            key={i}
            onClick={() => setFilter(i)}
            className={`text-sm px-3 py-1 border transition-colors ${
              filter === i
                ? 'border-[#6b8fa3] text-[#6b8fa3]'
                : 'border-[#2e3640] text-[#7a8694] hover:text-[#d4d8dd]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4 h-[600px]">
        <div className="w-1/3 bg-[#1a1e24] border border-[#2e3640] overflow-y-auto">
          <EmailList emails={emails} selected={selected} onSelect={selectEmail} />
        </div>
        <div className="flex-1 bg-[#1a1e24] border border-[#2e3640] p-4 overflow-y-auto">
          {selectedEmail ? (
            <div>
              <h2 className="text-[#d4d8dd] font-semibold mb-2">{selectedEmail.subject}</h2>
              <div className="text-xs text-[#7a8694] mb-4 space-y-1">
                <p>Von: {selectedEmail.fromAddr}</p>
                <p>An: {selectedEmail.toAddr}</p>
                <p>{new Date(selectedEmail.sentAt).toLocaleString('de-DE')}</p>
              </div>
              <div className="text-sm text-[#d4d8dd] border-t border-[#2e3640] pt-4">
                {selectedEmail.bodyType === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans">{selectedEmail.body}</pre>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[#7a8694] text-sm">E-Mail auswählen</p>
          )}
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={load}
      />
    </div>
  )
}
