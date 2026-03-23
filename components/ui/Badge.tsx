// components/ui/Badge.tsx
const variants = {
  default: 'bg-[#222830] text-[#7a8694]',
  success: 'bg-[#4a7c59]/20 text-[#4a7c59]',
  danger: 'bg-[#8b3a3a]/20 text-[#8b3a3a]',
  gold: 'bg-[#c9a84c]/20 text-[#c9a84c]',
  blue: 'bg-[#6b8fa3]/20 text-[#6b8fa3]',
} as const

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: keyof typeof variants }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-mono ${variants[variant]}`}>
      {children}
    </span>
  )
}
