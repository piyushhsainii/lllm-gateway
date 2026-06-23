import Link from 'next/link'
import styles from './FinalCTA.module.css'

export default function FinalCTA() {
  return (
    <div className={styles.outer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.eyebrow}>Get started today</span>
          <h2 className={styles.heading}>
            <strong>Ship in an afternoon.</strong><br />Free forever.
          </h2>
          <p className={styles.body}>
            Change one URL. Add one header. Full observability, budget enforcement,
            and multi-provider fallback — no credit card, no lock-in, no financial risk.
          </p>
        </div>
        <div className={styles.right}>
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
          <span className={styles.trust}>open source · BYOK · zero storage</span>
        </div>
      </div>
    </div>
  )
}
