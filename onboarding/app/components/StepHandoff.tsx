'use client'

import { useState } from 'react'

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function StepHandoff({ markdown, onRegenerate }: {
  markdown: string
  onRegenerate: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
        Your wiki is ready
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 28, lineHeight: 1.6 }}>
        Copy it into Cue and you're live.
      </p>

      {/* Instructions */}
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '16px 18px',
        marginBottom: 24,
      }}>
        <p style={{ ...MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 14 }}>
          How to add this to Cue
        </p>
        {[
          'Open Cue → Settings',
          'Paste into the Company Knowledge field',
          'Save',
        ].map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: i < 2 ? 10 : 0 }}>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--ink-faint)', minWidth: 14, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>{line}</span>
          </div>
        ))}
      </div>

      {/* Wiki textarea */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ ...MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
          Your wiki
        </p>
        <textarea
          readOnly
          value={markdown}
          rows={12}
          style={{
            ...MONO, fontSize: 11,
            lineHeight: 1.65,
            color: 'var(--ink-faint)',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            resize: 'vertical',
            cursor: 'text',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onRegenerate} style={{
          padding: '10px 18px', borderRadius: 6,
          border: '1px solid var(--line)', background: 'var(--surface)',
          color: 'var(--ink-dim)', ...MONO, fontSize: 11,
          letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.15s',
        }}>
          Regenerate
        </button>
        <button onClick={handleCopy} style={{
          flex: 1, padding: '10px 0', borderRadius: 6, border: 'none',
          background: copied ? 'var(--surface-2)' : 'var(--signal)',
          color: copied ? 'var(--signal)' : '#0d0c0a',
          ...MONO, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em',
          cursor: 'pointer', transition: 'all 0.2s',
          outline: copied ? '1px solid rgba(255,180,84,0.3)' : 'none',
        } as React.CSSProperties}>
          {copied ? 'Copied ✓' : 'Copy wiki'}
        </button>
      </div>
    </div>
  )
}
