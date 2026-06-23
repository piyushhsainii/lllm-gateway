import styles from './BenchStrip.module.css'

const ITEMS = [
  { num: '8', unit: '×',  label: 'Lower memory vs LiteLLM', sub: '500 concurrent streams' },
  { num: '3', unit: 'ms', label: 'P99 first-token latency',  sub: 'added overhead' },
  { num: '0', unit: '',   label: 'Stored credentials',       sub: 'Tier 1 default' },
  { num: '3', unit: '',   label: 'LLM providers',            sub: 'OpenAI · Anthropic · Gemini' },
]

export default function BenchStrip() {
  return (
    <div className={styles.strip}>
      {ITEMS.map((item, i) => (
        <div key={i} className={styles.item}>
          <span className={styles.num}>
            {item.num}<span>{item.unit}</span>
          </span>
          <div className={styles.label}>{item.label}</div>
          <div className={styles.sub}>{item.sub}</div>
        </div>
      ))}
    </div>
  )
}
