// components/ui/Table.tsx
export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left border-collapse">
        {children}
      </table>
    </div>
  )
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-xs font-medium text-[#7a8694] uppercase tracking-wider border-b border-[#2e3640] bg-[#1a1e24]">
      {children}
    </th>
  )
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2.5 text-[#d4d8dd] border-b border-[#2e3640] ${className}`}>
      {children}
    </td>
  )
}
