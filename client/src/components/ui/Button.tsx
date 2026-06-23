// components/ui/Button.tsx
'use client'

import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[#c94f1a] text-white rounded-lg hover:opacity-90 active:opacity-100',
    ghost: 'border border-[#e4e2dd] text-[#6b6860] rounded-lg font-mono hover:border-[#ccc9c2] hover:text-[#1c1b18]',
    secondary: 'bg-[#f4f3f0] text-[#1c1b18] rounded-lg hover:bg-[#e4e2dd]',
    danger: 'bg-red-600 text-white rounded-lg hover:opacity-90',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
