'use client'

// app/auth/login/page.tsx
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: brand panel */}
      <div className="w-1/2 bg-[#1c1b18] flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Rust radial gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 30% 60%, rgba(201,79,26,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#c94f1a] rounded flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 7L7 13L1 7L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <span className="font-mono text-base font-semibold text-white">llm-gateway</span>
        </div>

        {/* Main content */}
        <div className="relative">
          <h2 className="text-4xl font-semibold text-white mb-4 leading-tight" style={{ letterSpacing: '-0.04em' }}>
            One URL.<br />Every LLM.
          </h2>
          <p className="text-[#6b6860] font-light text-sm leading-relaxed mb-10">
            The Rust-powered reverse proxy that sits between your app and every LLM provider. BYOK, cost caps, automatic failover.
          </p>

          {/* Proof stats */}
          <div className="space-y-4">
            {[
              { value: '<1ms', label: 'Gateway overhead added' },
              { value: '0', label: 'Bytes of prompt data stored' },
              { value: '3+', label: 'LLM providers supported' },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="font-mono text-xl font-semibold text-[#c94f1a] w-16 flex-shrink-0" style={{ letterSpacing: '-0.03em' }}>
                  {value}
                </span>
                <span className="text-[#9c9890] text-xs font-light">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative font-mono text-[10px] text-[#6b6860] uppercase tracking-[0.12em]">
          Open source · Rust · Zero storage
        </div>
      </div>

      {/* Right: form */}
      <div className="w-1/2 flex items-center justify-center p-12 bg-[#fafaf9]">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-[#1c1b18] mb-1.5" style={{ letterSpacing: '-0.03em' }}>
              Sign in
            </h1>
            <p className="text-sm text-[#9c9890] font-light">Welcome back.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#6b6860] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-[#e4e2dd] rounded-lg px-3 py-2.5 text-sm font-light focus:outline-none focus:border-[#c94f1a] focus:ring-1 focus:ring-[#c94f1a] bg-white text-[#1c1b18] placeholder:text-[#9c9890]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b6860] block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#e4e2dd] rounded-lg px-3 py-2.5 text-sm font-light focus:outline-none focus:border-[#c94f1a] focus:ring-1 focus:ring-[#c94f1a] bg-white text-[#1c1b18] placeholder:text-[#9c9890]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c94f1a] text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in →'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-[#9c9890] font-light text-center">
            No account?{' '}
            <Link href="/auth/signup" className="text-[#c94f1a] hover:opacity-80">
              Create one
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-[#e4e2dd]">
            <p className="font-mono text-[10px] text-[#9c9890] text-center uppercase tracking-[0.08em]">
              open source · BYOK · zero storage
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
