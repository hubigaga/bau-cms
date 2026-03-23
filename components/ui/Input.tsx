// components/ui/Input.tsx
export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-[#0f1114] border border-[#2e3640] text-[#d4d8dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6b8fa3] placeholder:text-[#7a8694] ${className}`}
      {...props}
    />
  )
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full bg-[#0f1114] border border-[#2e3640] text-[#d4d8dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6b8fa3] placeholder:text-[#7a8694] resize-none ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full bg-[#0f1114] border border-[#2e3640] text-[#d4d8dd] px-3 py-2 text-sm focus:outline-none focus:border-[#6b8fa3] ${className}`}
      {...props}
    />
  )
}
