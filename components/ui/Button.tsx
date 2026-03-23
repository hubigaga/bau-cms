// components/ui/Button.tsx
const variants = {
  primary: 'bg-[#c9a84c] text-[#0f1114] hover:bg-[#b8973b]',
  secondary: 'bg-[#222830] text-[#d4d8dd] border border-[#2e3640] hover:bg-[#2e3640]',
  danger: 'bg-[#8b3a3a] text-[#d4d8dd] hover:bg-[#7a2929]',
} as const

export function Button({
  children, variant = 'primary', className = '', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
