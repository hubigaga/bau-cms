'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function SettingsPage() {
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwStatus({ type: 'error', msg: 'Passwörter stimmen nicht überein.' })
      return
    }
    setSaving(true)
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    setSaving(false)
    if (res.ok) {
      setPwStatus({ type: 'success', msg: 'Passwort geändert.' })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      const data = await res.json()
      setPwStatus({ type: 'error', msg: data.error ?? 'Fehler beim Ändern.' })
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <h1 className="text-[#d4d8dd] text-xl font-semibold">Einstellungen</h1>

      <Card>
        <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-4">E-Mail-Konfiguration</h2>
        <div className="space-y-2 text-sm text-[#7a8694]">
          <p>IMAP/SMTP-Einstellungen werden über Umgebungsvariablen in <code className="text-[#6b8fa3]">.env.local</code> konfiguriert:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS</li>
            <li>SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM</li>
          </ul>
          <p className="mt-2">Nach Änderungen muss der Server neu gestartet werden.</p>
        </div>
      </Card>

      <Card>
        <h2 className="text-[#7a8694] text-xs uppercase tracking-wide mb-4">Admin-Passwort ändern</h2>
        <form onSubmit={changePassword} className="space-y-3">
          {pwStatus && (
            <p className={`text-sm ${pwStatus.type === 'success' ? 'text-[#4a7c59]' : 'text-[#8b3a3a]'}`}>
              {pwStatus.msg}
            </p>
          )}
          <Input
            type="password"
            placeholder="Aktuelles Passwort"
            value={pwForm.currentPassword}
            onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder="Neues Passwort"
            value={pwForm.newPassword}
            onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
            required
            minLength={8}
          />
          <Input
            type="password"
            placeholder="Neues Passwort bestätigen"
            value={pwForm.confirmPassword}
            onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
            required
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Wird gespeichert...' : 'Passwort ändern'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
