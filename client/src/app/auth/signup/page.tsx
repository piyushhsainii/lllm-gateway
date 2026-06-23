'use client'

// app/auth/signup/page.tsx
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    router.push('/onboarding')
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex">
      {/* Left: brand panel */}
      <div className="w-1/2 bg-[#1c1b18] flex flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 70% 40%, rgba(201,79,26,0.2) 0%, transparent 70%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#c94f1a] rounded flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 7L7 13L1 7L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <span className="font-mono text-base font-semibold text-white">llm-gateway</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-semibold text-white mb-4 leading-tight" style={{ letterSpacing: '-0.04em' }}>
            Ship LLM features<br />without the ops.
          </h2>
          <p className="text-[#6b6860] font-light text-sm leading-relaxed mb-10">
            Set up in 2 minutes. Point your existing code at a new URL and unlock cost controls, failovers, and usage analytics.
          </p>
          <div className="bg-[#111] rounded-lg p-4 border border-[#333]">
            <div className="font-mono text-xs text-[#9c9890] mb-2">It really is just one line</div>
            <div className="font-mono text-sm">
              <span className="text-white">base_url</span>
              <span className="text-[#6b6860]"> = </span>
              <span className="text-[#c94f1a]">"https://api.llmgateway.io/v1"</span>
            </div>
          </div>
        </div>

        <div className="relative font-mono text-[10px] text-[#6b6860] uppercase tracking-[0.12em]">
          Free tier · No credit card · Open source
        </div>
      </div>

      {/* Right: form */}
      <div className="w-1/2 flex items-center justify-center p-12 bg-[#fafaf9]">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-[#1c1b18] mb-1.5" style={{ letterSpacing: '-0.03em' }}>
              Create account
            </h1>
            <p className="text-sm text-[#9c9890] font-light">Free forever. No card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: 'name', label: 'Full name', placeholder: 'Aryan Sharma', type: 'text' },
              { field: 'company', label: 'Company', placeholder: 'Acme AI (optional)', type: 'text' },
              { field: 'email', label: 'Work email', placeholder: 'you@company.com', type: 'email' },
              { field: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field}>
                <label className="text-xs font-medium text-[#6b6860] block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={update(field)}
                  placeholder={placeholder}
                  className="w-full border border-[#e4e2dd] rounded-lg px-3 py-2.5 text-sm font-light focus:outline-none focus:border-[#c94f1a] focus:ring-1 focus:ring-[#c94f1a] bg-white text-[#1c1b18] placeholder:text-[#9c9890]"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c94f1a] text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account →'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-[#9c9890] font-light text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#c94f1a] hover:opacity-80">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-[10px] text-[#9c9890] font-light text-center leading-relaxed">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
