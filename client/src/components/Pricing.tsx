import styles from './Pricing.module.css'

type Feature = { included: boolean; text: string }

interface Plan {
  name: string
  price: string
  sub?: string
  tagline: string
  cta: string
  featured?: boolean
  features: Feature[]
}

const PLANS: Plan[] = [
  {
    name: 'Free', price: '$0', tagline: 'Forever, no card required', cta: 'Get started',
    features: [
      { included: true,  text: 'BYOK Tier 1 (zero storage)' },
      { included: true,  text: '10K requests / month' },
      { included: true,  text: 'All 3 providers' },
      { included: true,  text: 'Basic dashboard' },
      { included: false, text: 'Encrypted key storage' },
      { included: false, text: 'Webhooks' },
    ],
  },
  {
    name: 'Pro', price: '$19', sub: '/mo', tagline: 'Most popular', cta: 'Start Pro →', featured: true,
    features: [
      { included: true,  text: 'BYOK Tier 1 + 2' },
      { included: true,  text: 'Unlimited requests' },
      { included: true,  text: 'Full analytics' },
      { included: true,  text: 'Budget webhooks' },
      { included: true,  text: 'Priority support' },
      { included: false, text: 'Sub-key hierarchy' },
    ],
  },
  {
    name: 'Team', price: '$49', sub: '/mo', tagline: 'For growing teams', cta: 'Start Team',
    features: [
      { included: true, text: 'Everything in Pro' },
      { included: true, text: 'Multiple team members' },
      { included: true, text: 'Sub-key hierarchy' },
      { included: true, text: 'Per-user spend tracking' },
      { included: true, text: 'Audit export' },
      { included: true, text: 'SSO' },
    ],
  },
  {
    name: 'Enterprise', price: 'Custom', tagline: 'Self-hosted license', cta: 'Talk to us',
    features: [
      { included: true, text: 'BYOK Tier 3 (self-hosted)' },
      { included: true, text: 'Full source code' },
      { included: true, text: 'Flat monthly license' },
      { included: true, text: 'Your infra, your data' },
      { included: true, text: 'Custom SLA' },
      { included: true, text: 'Dedicated support' },
    ],
  },
]

export default function Pricing() {
  return (
    <div className={styles.outer} id="pricing">
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className="section-label" style={{ display: 'block', textAlign: 'center' }}>
            Pricing
          </span>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            You pay for the gateway.<br /><strong>Not for API access.</strong>
          </h2>
          <p className="section-body" style={{ margin: '0 auto', textAlign: 'center' }}>
            Your LLM bills go directly to OpenAI/Anthropic. We&apos;re devtools SaaS, not a reseller.
          </p>
        </div>

        <div className={styles.grid}>
          {PLANS.map((plan) => (
            <div key={plan.name} className={`${styles.card} ${plan.featured ? styles.featured : ''}`}>
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>
                {plan.price}
                {plan.sub && <sub>{plan.sub}</sub>}
              </div>
              <div className={styles.planTagline}>{plan.tagline}</div>
              <button className={`${styles.btn} ${plan.featured ? styles.btnPrimary : styles.btnSecondary}`}>
                {plan.cta}
              </button>
              <ul className={styles.feats}>
                {plan.features.map((f) => (
                  <li key={f.text}>
                    <span className={f.included ? styles.check : styles.cross}>
                      {f.included ? '✓' : '–'}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
