import styles from './Pipeline.module.css'

const STEPS = [
  { num: '01', name: 'Auth',              desc: 'Gateway key validated. KeyContext attached. Unauthorized → 401 immediately.',                     tag: 'DB lookup'     },
  { num: '02', name: 'Rate limiter',      desc: 'Token bucket per key. No Redis. DashMap in-memory. 429 + Retry-After.',                           tag: 'lock-free'     },
  { num: '03', name: 'Budget enforcer',   desc: 'Atomic reservation before upstream call. No double-spending across concurrent requests.',          tag: 'AtomicU64'     },
  { num: '04', name: 'Deduplicator',      desc: 'Request hash with 5s LRU cache. Retried requests return cached — zero double-billing.',            tag: 'X-Cache: HIT'  },
  { num: '05', name: 'Router',            desc: 'Model name → provider. Translate body to Anthropic/Gemini shape. Inject key.',                    tag: 'config-driven' },
  { num: '06', name: 'Upstream client',   desc: 'Connection pooling. 5s connect, 30s first token. Auto-fallback on 5xx.',                           tag: 'reqwest'       },
  { num: '07', name: 'Zero-copy streamer',desc: 'SSE bytes pass through unmodified. Token counter reads same &[u8] reference.',                    tag: 'zero-copy'     },
  { num: '08', name: 'Cost recorder',     desc: 'Settle actual vs estimated. Write UsageRecord to SQLite. Update Prometheus.',                      tag: 'batched writes'},
]

export default function Pipeline() {
  return (
    <div className={styles.wrap} id="pipeline">
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>
            Request pipeline
          </span>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Every request through 12 stages.<br />
            <strong>Failures short-circuit before touching upstream.</strong>
          </h2>
        </div>
        <div className={styles.grid}>
          {STEPS.map((s) => (
            <div key={s.num} className={styles.step}>
              <span className={styles.num}>{s.num}</span>
              <div className={styles.name}>{s.name}</div>
              <div className={styles.desc}>{s.desc}</div>
              <span className={styles.tag}>{s.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
