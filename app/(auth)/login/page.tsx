// app/(auth)/login/page.tsx
'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      username: fd.get('username'),
      password: fd.get('password'),
      redirect: false,
    })
    if (res?.ok) router.push('/')
    else setError('Ungültige Anmeldedaten')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1114]">
      <form onSubmit={handleSubmit} className="bg-[#1a1e24] border border-[#2e3640] p-8 w-full max-w-sm space-y-4">
        <h1 className="text-[#d4d8dd] text-xl font-semibold">Anmelden</h1>
        {error && <p className="text-[#8b3a3a] text-sm">{error}</p>}
        <input name="username" placeholder="Benutzername"
          className="w-full bg-[#0f1114] border border-[#2e3640] text-[#d4d8dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6b8fa3]" />
        <input name="password" type="password" placeholder="Passwort"
          className="w-full bg-[#0f1114] border border-[#2e3640] text-[#d4d8dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6b8fa3]" />
        <button type="submit"
          className="w-full bg-[#c9a84c] text-[#0f1114] py-2 text-sm font-semibold hover:bg-[#b8973b]">
          Anmelden
        </button>
      </form>
    </div>
  )
}
