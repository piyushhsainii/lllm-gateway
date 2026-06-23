import Link from 'next/link'
import styles from './Nav.module.css'

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.dot} />
        llm-gateway
      </div>
      <div className={styles.links}>
        <Link href="#how">How it works</Link>
        <Link href="#pipeline">Pipeline</Link>
        <Link href="#pricing">Pricing</Link>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
      </div>
      <button className={styles.cta}>Start Free →</button>
    </nav>
  )
}
