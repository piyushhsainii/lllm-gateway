'use client'

// app/(marketing)/page.tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgba(250,250,249,0.9)] backdrop-blur-md border-b border-[#e4e2dd] flex items-center justify-between px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-[#c94f1a] rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 7L7 13L1 7L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <span className="font-mono text-sm font-semibold text-[#1c1b18]">llm-gateway</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-xs text-[#6b6860] hover:text-[#1c1b18] transition-colors font-light">Features</a>
          <a href="#pricing" className="text-xs text-[#6b6860] hover:text-[#1c1b18] transition-colors font-light">Pricing</a>
          <a href="https://docs.llmgateway.io" className="text-xs text-[#6b6860] hover:text-[#1c1b18] transition-colors font-light">Docs</a>
          <Link href="/auth/login" className="text-xs text-[#6b6860] hover:text-[#1c1b18] transition-colors font-light">Sign in</Link>
          <Link href="/auth/signup" className="bg-[#c94f1a] text-white rounded-lg px-4 py-2 text-xs font-medium hover:opacity-90 transition-opacity">
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-8 max-w-5xl mx-auto">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-medium text-[#c94f1a] tracking-[0.1em] uppercase border border-[#f0cabb] rounded-full bg-[#fdf1ec] px-3.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse inline-block" />
            Open source · Rust · Zero storage
          </span>
        </div>

        <h1 className="text-5xl font-semibold text-center text-[#1c1b18] mb-6 leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>
          One URL to rule<br />all your LLMs
        </h1>

        <p className="text-center text-[#6b6860] text-lg font-light max-w-xl mx-auto mb-8 leading-relaxed">
          Drop-in reverse proxy for OpenAI, Anthropic, and Google. BYOK, rate limits, cost caps, automatic fallbacks — no code changes.
        </p>

        <div className="flex items-center justify-center gap-3 mb-16">
          <Link href="/auth/signup" className="bg-[#c94f1a] text-white rounded-lg px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity">
            Start for free
          </Link>
          <a href="https://github.com/llmgateway" className="border border-[#e4e2dd] text-[#6b6860] rounded-lg px-5 py-3 font-mono text-xs hover:border-[#ccc9c2] hover:text-[#1c1b18] transition-all flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 0C3.13 0 0 3.13 0 7c0 3.09 2.01 5.72 4.79 6.65.35.06.48-.15.48-.34v-1.2c-1.95.42-2.36-.94-2.36-.94-.32-.81-.78-1.03-.78-1.03-.64-.44.05-.43.05-.43.7.05 1.07.72 1.07.72.62 1.07 1.63.76 2.03.58.06-.45.24-.76.44-.93-1.56-.18-3.2-.78-3.2-3.47 0-.77.27-1.4.72-1.89-.07-.18-.31-.9.07-1.87 0 0 .59-.19 1.93.72A6.7 6.7 0 017 3.72c.6 0 1.2.08 1.76.23 1.34-.91 1.93-.72 1.93-.72.38.97.14 1.69.07 1.87.45.49.72 1.12.72 1.89 0 2.7-1.64 3.29-3.2 3.47.25.22.47.65.47 1.31v1.94c0 .19.13.4.48.34A7.002 7.002 0 0014 7c0-3.87-3.13-7-7-7z"/>
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Code snippet */}
        <div className="bg-[#1c1b18] rounded-xl p-6 max-w-2xl mx-auto shadow-lg">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-[10px] text-[#6b6860]">gateway.toml</span>
          </div>
          <pre className="font-mono text-sm leading-relaxed">
            <span className="text-[#9c9890]"># Before</span>{'\n'}
            <span className="text-white">base_url</span> = <span className="text-red-400 line-through opacity-50">"https://api.openai.com/v1"</span>{'\n\n'}
            <span className="text-[#9c9890]"># After — that's it</span>{'\n'}
            <span className="text-white">base_url</span> = <span className="text-[#c94f1a]">"https://api.llmgateway.io/v1"</span>{'\n\n'}
            <span className="text-[#9c9890]"># Optional: per-request headers</span>{'\n'}
            <span className="text-white">X-Gateway-Key</span>: <span className="text-blue-400">"gw_live_••••••••"</span>{'\n'}
            <span className="text-white">X-Provider-Keys</span>: <span className="text-blue-400">"sk-•••"</span>
          </pre>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-8 border-t border-b border-[#e4e2dd] bg-[#f4f3f0]">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-8">
          {[
            { value: '<1ms', label: 'Gateway overhead' },
            { value: '3+', label: 'Supported providers' },
            { value: '99.99%', label: 'Uptime SLA (Pro)' },
            { value: '0 bytes', label: 'Prompt storage' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-mono text-3xl font-semibold text-[#c94f1a] mb-1" style={{ letterSpacing: '-0.04em' }}>
                {value}
              </div>
              <div className="text-xs text-[#9c9890] font-light">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-mono text-[10.5px] font-medium text-[#c94f1a] uppercase tracking-[0.12em] block mb-4">
            Features
          </span>
          <h2 className="text-3xl font-semibold text-[#1c1b18]" style={{ letterSpacing: '-0.04em' }}>
            Everything your LLM stack needs
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {[
            {
              title: 'Bring your own keys',
              desc: 'Your OpenAI, Anthropic, and Google keys stay yours. We encrypt and proxy — never store plaintext.',
              icon: '🔑',
            },
            {
              title: 'Hard cost caps',
              desc: 'Set monthly budgets per API key. Requests stop the moment you hit the limit — no surprise bills.',
              icon: '💰',
            },
            {
              title: 'Automatic fallbacks',
              desc: 'If one provider goes down, we route to your next-best option automatically. Zero config required.',
              icon: '↩️',
            },
            {
              title: 'Semantic caching',
              desc: 'Identical prompts return cached responses instantly. No token burn on repeated queries.',
              icon: '⚡',
            },
            {
              title: 'Rate limiting',
              desc: 'Per-key RPM limits. Protect yourself from runaway scripts and shared team over-usage.',
              icon: '🛡️',
            },
            {
              title: 'Privacy by design',
              desc: 'Prompt content is never logged. Only tokens, cost, latency, and status codes. Always.',
              icon: '🔒',
            },
          ].map(({ title, desc, icon }) => (
            <div key={title} className="bg-white border border-[#e4e2dd] rounded-xl p-6 shadow-sm">
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="text-sm font-semibold text-[#1c1b18] mb-2" style={{ letterSpacing: '-0.02em' }}>
                {title}
              </h3>
              <p className="text-xs text-[#6b6860] font-light leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-8 bg-[#f4f3f0] border-t border-[#e4e2dd]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono text-[10.5px] font-medium text-[#c94f1a] uppercase tracking-[0.12em] block mb-4">
              Pricing
            </span>
            <h2 className="text-3xl font-semibold text-[#1c1b18]" style={{ letterSpacing: '-0.04em' }}>
              Simple, honest pricing
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: ['3 API keys', '10k requests/mo', 'Standard BYOK', 'Community support'],
                cta: 'Get started',
                featured: false,
              },
              {
                name: 'Pro',
                price: '$19',
                period: '/month',
                features: ['20 API keys', 'Unlimited requests', 'All BYOK tiers', 'Email support', 'Webhooks'],
                cta: 'Start Pro',
                featured: true,
              },
              {
                name: 'Team',
                price: '$49',
                period: '/month',
                features: ['Unlimited keys', 'Unlimited requests', 'All BYOK tiers', 'Priority support', 'SSO'],
                cta: 'Start Team',
                featured: false,
              },
            ].map(({ name, price, period, features, cta, featured }) => (
              <div
                key={name}
                className={`bg-white rounded-xl p-6 shadow-sm ${
                  featured
                    ? 'border border-[#c94f1a] ring-1 ring-[#c94f1a]'
                    : 'border border-[#e4e2dd]'
                }`}
              >
                {featured && (
                  <div className="font-mono text-[10px] text-[#c94f1a] uppercase tracking-[0.1em] mb-3">
                    Most popular
                  </div>
                )}
                <div className="font-semibold text-[#1c1b18] mb-1">{name}</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-mono text-3xl font-semibold text-[#1c1b18]" style={{ letterSpacing: '-0.04em' }}>
                    {price}
                  </span>
                  <span className="text-xs text-[#9c9890]">{period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#6b6860] font-light">
                      <span className="text-[#16a34a]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity ${
                    featured
                      ? 'bg-[#c94f1a] text-white hover:opacity-90'
                      : 'border border-[#e4e2dd] text-[#6b6860] hover:border-[#ccc9c2] hover:text-[#1c1b18]'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-8 border-t border-[#e4e2dd]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-[#c94f1a] rounded flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 7L7 13L1 7L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
                <circle cx="7" cy="7" r="2" fill="white"/>
              </svg>
            </div>
            <span className="font-mono text-xs text-[#9c9890]">llm-gateway</span>
          </div>
          <div className="font-mono text-[10px] text-[#9c9890]">
            open source · BYOK · zero storage
          </div>
        </div>
      </footer>
    </div>
  )
}
