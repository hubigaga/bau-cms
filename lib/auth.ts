// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Benutzername', type: 'text' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: user.id, name: user.username }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
}
