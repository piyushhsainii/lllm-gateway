import PinSvg from './PinSvg'
import styles from './Fallback.module.css'

export default function Fallback() {
  return (
    <div className={styles.section}>
      <div className="two-col reverse">
        <div>
          <span className="section-label">Reliability</span>
          <h2 className="section-title">
            OpenAI goes down.<br /><strong>Your app doesn&apos;t.</strong>
          </h2>
          <p className="section-body">
            Provider health tracked via background task every 30 seconds.
            When error rate exceeds 5% in a 60-second window, the router
            automatically falls back to an equivalent model on a healthy provider.
            Fallback mappings are config-defined — opt out anytime for strict
            provider control.
          </p>
          <br />
          <p className="section-body">
            Your customers never notice. The dashboard shows which fallback was
            used and when.
          </p>
        </div>

        <div className="paper-card-wrap">
          <PinSvg gradientId="pinFallback" />
          <div className="paper-card">
            <span className="paper-label">gateway.toml — routing</span>
            <div className="paper-row"><span className="paper-key">[routing]</span></div>
            <div className="paper-row" style={{ paddingLeft: '16px' }}>
              <span className="paper-str">&quot;gpt-4o&quot;</span>
              <span className="paper-dim">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=&nbsp;</span>
              <span className="paper-val">&quot;openai&quot;</span>
            </div>
            <div className="paper-row" style={{ paddingLeft: '16px' }}>
              <span className="paper-str">&quot;claude-sonnet&quot;</span>
              <span className="paper-dim">&nbsp;=&nbsp;</span>
              <span className="paper-val">&quot;anthropic&quot;</span>
            </div>
            <div className="paper-row" style={{ paddingLeft: '16px' }}>
              <span className="paper-str">&quot;gemini-1.5-pro&quot;</span>
              <span className="paper-dim">&nbsp;=&nbsp;</span>
              <span className="paper-val">&quot;google&quot;</span>
            </div>

            <div className="paper-spacer" />

            <span className="paper-label">fallback config</span>
            <div className="paper-row"><span className="paper-key">[fallback]</span></div>
            <div className="paper-row" style={{ paddingLeft: '16px' }}>
              <span className="paper-str">&quot;gpt-4o&quot;</span>
              <span className="paper-dim">&nbsp;=&nbsp;</span>
              <span className="paper-val">&quot;claude-sonnet-4-5&quot;</span>
            </div>
            <div className="paper-row" style={{ paddingLeft: '16px' }}>
              <span className="paper-key">error_threshold</span>
              <span className="paper-dim">&nbsp;=&nbsp;</span>
              <span className="paper-rust">0.05</span>
            </div>
            <div className="paper-row" style={{ paddingLeft: '16px' }}>
              <span className="paper-key">window_seconds</span>
              <span className="paper-dim">&nbsp;&nbsp;=&nbsp;</span>
              <span className="paper-rust">60</span>
            </div>

            <div className="paper-spacer" />

            <span className="paper-label">Response header</span>
            <div className="paper-row">
              <span className="paper-key">X-Gateway-Provider</span>
              <span className="paper-dim">:&nbsp;</span>
              <span className="paper-rust">anthropic (fallback)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
