// components/ui/Card.tsx

interface CardProps {
  children: React.ReactNode
  className?: string
  active?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', active = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border rounded-xl shadow-sm
        ${active
          ? 'border-[#c94f1a] ring-1 ring-[#c94f1a]'
          : 'border-[#e4e2dd]'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
