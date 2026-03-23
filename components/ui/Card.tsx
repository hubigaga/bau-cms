// components/ui/Card.tsx
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a1e24] border border-[#2e3640] p-4 ${className}`}>
      {children}
    </div>
  )
}
