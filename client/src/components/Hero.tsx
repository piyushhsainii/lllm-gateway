import Link from 'next/link'
import PinSvg from './PinSvg'
import styles from './Hero.module.css'

const REQUEST_LOG = [
  { time: '12:04:51', model: 'gpt-4o',         tokens: '1,842', cost: '$0.011', badge: 'ok'  as const },
  { time: '12:04:49', model: 'claude-sonnet',   tokens: '3,210', cost: '$0.009', badge: 'ok'  as const },
  { time: '12:04:48', model: 'gpt-4o',          tokens: '914',   cost: '$0.000', badge: 'hit' as const },
  { time: '12:04:46', model: 'gemini-1.5-pro',  tokens: '2,088', cost: '$0.006', badge: 'ok'  as const },
  { time: '12:04:44', model: 'gpt-4o → claude', tokens: '1,560', cost: '$0.005', badge: 'fb'  as const },
]

const BADGE_LABELS = { ok: '200', hit: 'cached', fb: 'fallback' } as const

const PROOF = [
  { num: '8×',  label: 'less memory than LiteLLM' },
  { num: '3ms', label: 'P99 added latency' },
  { num: '0',   label: 'stored credentials' },
]

const MINI_STATS = [
  { val: '$4.28', unit: '/day', label: 'Spend this month' },
  { val: '99.',   unit: '4%',  label: 'Uptime (30d)' },
  { val: '14',    unit: 'ms',  label: 'Median latency' },
]

export default function Hero() {
  return (
    <section className={styles.hero}>
      {/* ── LEFT ── */}
      <div className={styles.left}>
        <h1 className={styles.h1}>
          The LLM proxy<br />
          your team <em className={styles.em}>actually</em><br />
          <strong>needs.</strong>
        </h1>
        <p className={styles.sub}>
          One proxy. Every LLM. Your keys, your billing, zero risk.
        </p>
        <div className={styles.actions}>
          <Link href="#pricing" className={styles.btnPrimary}>
            Start for free →
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnGhost}
          >
            $ cargo install llm-gateway
          </a>
        </div>
        <div className={styles.proof}>
          {PROOF.map((p, i) => (
            <>
              <div key={p.num} className={styles.proofItem}>
                <span className={styles.proofNum}>{p.num}</span>
                <span className={styles.proofLabel}>{p.label}</span>
              </div>
              {i < PROOF.length - 1 && (
                <div key={`sep-${i}`} className={styles.proofSep} />
              )}
            </>
          ))}
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className={styles.right}>
        {/* Request log card with pin */}
        <div className="paper-card-wrap" style={{ paddingTop: '18px' }}>
          <PinSvg gradientId="pinHero" />
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>REQUEST LOG</span>
              <div className={styles.live}>
                <span className={styles.liveDot} />
                live
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={`${styles.reqRow} ${styles.reqRowHead}`}>
                <span>time</span>
                <span>model</span>
                <span style={{ textAlign: 'right' }}>tokens</span>
                <span style={{ textAlign: 'right' }}>cost</span>
                <span style={{ textAlign: 'right' }}>status</span>
              </div>
              {REQUEST_LOG.map((r) => (
                <div key={r.time + r.model} className={styles.reqRow}>
                  <span className={styles.reqTime}>{r.time}</span>
                  <span className={styles.reqModel}>{r.model}</span>
                  <span className={styles.reqTokens}>{r.tokens}</span>
                  <span className={styles.reqCost}>{r.cost}</span>
                  <span className={styles.reqStatus}>
                    <span className={styles[`badge${r.badge.charAt(0).toUpperCase() + r.badge.slice(1)}` as keyof typeof styles]}>
                      {BADGE_LABELS[r.badge]}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className={styles.miniStats}>
          {MINI_STATS.map((s) => (
            <div key={s.label} className={styles.miniStat}>
              <div className={styles.miniStatVal}>
                {s.val}<span>{s.unit}</span>
              </div>
              <div className={styles.miniStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
