'use client'

import { useState } from 'react'
import styles from './FAQ.module.css'

const FAQS = [
  {
    q: 'Do you ever store my OpenAI API key?',
    a: `On the default free tier (Tier 1), no — literally cannot. Your key arrives in the X-Provider-Key header, lives in memory for the duration of one request, and is never written to disk or any log. We physically can't store something we never write. On Tier 2 (Pro+), you opt in to encrypted storage (AES-256-GCM) — and you can audit exactly how it works in our open-source code.`,
  },
  {
    q: 'Who pays OpenAI/Anthropic?',
    a: `You do, directly. You bring your own API key purchased from OpenAI, Anthropic, or Google. They bill your card. We never touch your LLM billing. We charge a flat monthly fee for the gateway software — observability, budget enforcement, routing, and the dashboard.`,
  },
  {
    q: 'Is this just LiteLLM with a nicer UI?',
    a: `LiteLLM is Python and buffers response streams. llm-gateway is Rust with zero-copy SSE passthrough — the borrow checker enforces that the token counter can't hold bytes longer than the forwarder, so zero-copy is a compile-time guarantee. At 500 concurrent streaming requests, memory usage is 8× lower and P99 latency to first token is significantly better. The benchmark script is in the repo — reproduce it yourself.`,
  },
  {
    q: 'Do I need to change my request format for Anthropic or Gemini?',
    a: `No. OpenAI format is the canonical format the gateway accepts. If you route to Anthropic (by using a claude- model), the gateway translates the request body automatically — including pulling the system prompt out of messages and mapping the model string to the versioned Anthropic model ID. You always send and receive OpenAI-compatible JSON.`,
  },
  {
    q: 'What happens if my budget runs out mid-month?',
    a: `Requests get a 402 response before hitting upstream — your API credits are not spent. Configure webhooks to fire at 80% and 100% of your budget so you're never surprised. Budget enforcement uses atomic reservations to handle concurrent requests correctly.`,
  },
  {
    q: 'Can I see my prompts in the dashboard?',
    a: `No — by design. The audit log records metadata only: timestamp, model, token counts, cost, latency, cache hit, and provider used. Prompt content and response content are never logged. This is a deliberate privacy-first decision, not a limitation we plan to change.`,
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className={styles.section}>
      <span className="section-label">FAQ</span>
      <h2 className="section-title"><strong>Common questions</strong></h2>

      <div className={styles.list}>
        {FAQS.map((item, i) => (
          <div
            key={i}
            className={styles.item}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className={styles.question}>
              {item.q}
              <span className={`${styles.arrow} ${open === i ? styles.arrowOpen : ''}`}>+</span>
            </div>
            {open === i && (
              <div className={styles.answer}>{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
