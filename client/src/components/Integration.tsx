import PinSvg from './PinSvg'
import styles from './Integration.module.css'

export default function Integration() {
  return (
    <div className={styles.section} id="how">
      <div className="two-col">
        {/* Left copy */}
        <div>
          <span className="section-label">Integration</span>
          <h2 className="section-title">
            <strong>Change one line.</strong><br />Done.
          </h2>
          <p className="section-body">
            Your app already speaks OpenAI format. So does the gateway.
            Point your{' '}
            <code className={styles.code}>base_url</code>{' '}
            at us, add your gateway key, and every provider — including
            Anthropic and Gemini — works without changing your request format.
          </p>
          <br />
          <span className="diff-inline">✓ Same request shape. Same response shape.</span>
        </div>

        {/* Right — paper card */}
        <div className="paper-card-wrap">
          <PinSvg gradientId="pinIntegration" />
          <div className="paper-card">
            <span className="paper-label">Before</span>
            <div className="paper-row">
              <span className="paper-key">base_url</span>
              <span className="paper-eq">=</span>
              <span className="paper-str">&quot;https://api.openai.com/v1&quot;</span>
            </div>

            <hr className="paper-divider" style={{ marginTop: '14px' }} />

            <span className="paper-label">After — that&apos;s it</span>
            <div className="paper-row">
              <span className="paper-key">base_url</span>
              <span className="paper-eq">=</span>
              <span className="paper-rust">&quot;https://yourgateway.com/v1&quot;</span>
            </div>

            <div className="paper-spacer" />

            <span className="paper-label">Request body — unchanged</span>
            <div className="paper-row"><span className="paper-dim">{'{'}</span></div>
            <div className="paper-row" style={{ paddingLeft: '20px' }}>
              <span className="paper-key">&quot;model&quot;</span>
              <span className="paper-dim">:&nbsp;</span>
              <span className="paper-str">&quot;claude-sonnet-4-5&quot;</span>
              <span className="paper-comment">&nbsp;← or gpt-4o</span>
            </div>
            <div className="paper-row" style={{ paddingLeft: '20px' }}>
              <span className="paper-key">&quot;messages&quot;</span>
              <span className="paper-dim">: [...]</span>
            </div>
            <div className="paper-row"><span className="paper-dim">{'}'}</span></div>

            <div className="paper-spacer" />

            <span className="paper-label">Headers</span>
            <div className="paper-row">
              <span className="paper-key">Authorization</span>
              <span className="paper-dim">:&nbsp;Bearer&nbsp;</span>
              <span className="paper-rust">gw_live_abc123</span>
            </div>
            <div className="paper-row">
              <span className="paper-key">X-Provider-Key</span>
              <span className="paper-dim">:&nbsp;</span>
              <span className="paper-val">sk-openai-xyz-YOURS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
