import styles from './Footer.module.css'

export default function Footer() {
  return (
    <div className={styles.wrap}>
      <footer className={styles.footer}>
        <span>
          © 2025 llm-gateway. Open source.{' '}
          <a href="#">GitHub</a> · <a href="#">Docs</a> · <a href="#">Privacy</a>
        </span>
        <span className={styles.tag}>Built in Rust</span>
      </footer>
    </div>
  )
}
