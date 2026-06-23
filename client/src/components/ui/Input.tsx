// components/ui/Input.tsx
import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: React.ReactNode
}

export function Input({ label, error, prefix, suffix, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[#6b6860] tracking-[-0.01em]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-sm text-[#9c9890] font-mono pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          className={`
            w-full border border-[#e4e2dd] rounded-lg py-2 text-sm font-light
            focus:outline-none focus:border-[#c94f1a] focus:ring-1 focus:ring-[#c94f1a]
            bg-white text-[#1c1b18] placeholder:text-[#9c9890]
            ${prefix ? 'pl-7' : 'px-3'}
            ${suffix ? 'pr-10' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 flex items-center">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
