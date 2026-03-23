'use client'
import { Badge } from '@/components/ui/Badge'

interface Email {
  id: string
  subject: string
  fromAddr: string
  toAddr: string
  direction: string
  sentAt: string
  isRead: boolean
}

interface Props {
  emails: Email[]
  selected: string | null
  onSelect: (id: string) => void
}

export function EmailList({ emails, selected, onSelect }: Props) {
  return (
    <div className="divide-y divide-[#2e3640]">
      {emails.map(email => (
        <button
          key={email.id}
          onClick={() => onSelect(email.id)}
          className={`w-full text-left p-3 hover:bg-[#222830] transition-colors ${
            selected === email.id ? 'bg-[#222830] border-l-2 border-[#6b8fa3]' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm ${email.isRead ? 'text-[#7a8694]' : 'text-[#d4d8dd] font-medium'}`}>
              {email.direction === 'IN' ? email.fromAddr : email.toAddr}
            </span>
            <span className="text-xs text-[#7a8694]">
              {new Date(email.sentAt).toLocaleDateString('de-DE')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className={`text-xs truncate flex-1 ${email.isRead ? 'text-[#7a8694]' : 'text-[#d4d8dd]'}`}>
              {email.subject}
            </p>
            <Badge variant={email.direction === 'IN' ? 'blue' : 'default'}>
              {email.direction === 'IN' ? 'Eingang' : 'Ausgang'}
            </Badge>
          </div>
        </button>
      ))}
      {emails.length === 0 && (
        <p className="text-center text-[#7a8694] text-sm py-8">Keine E-Mails.</p>
      )}
    </div>
  )
}
