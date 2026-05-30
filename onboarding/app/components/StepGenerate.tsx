'use client'

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function StepGenerate({ building, error, markdown, onSuccess, onBack, onRetry }: {
  building: boolean
  error: string
  markdown: string
  onSuccess: () => void
  onBack: () => void
  onRetry: () => void
}) {
  if (building) {
    return (
      <div style={{ paddingTop: 40, textAlign: 'center' }}>
        <p style={{ ...MONO, fontSize: 13, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}>
          Building your wiki
          <span className="dot-1" style={{ display: 'inline-block', marginLeft: 2 }}>.</span>
          <span className="dot-2" style={{ display: 'inline-block' }}>.</span>
          <span className="dot-3" style={{ display: 'inline-block' }}>.</span>
        </p>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--ink-faint)', marginTop: 10, letterSpacing: '0.06em' }}>
          This takes about 10 seconds
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
          Something went wrong
        </h2>
        <p style={{ ...MONO, fontSize: 11, color: 'var(--signal)', marginBottom: 28, lineHeight: 1.6 }}>
          {error}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{
            padding: '10px 18px', borderRadius: 6,
            border: '1px solid var(--line)', background: 'var(--surface)',
            color: 'var(--ink-dim)', ...MONO, fontSize: 11, cursor: 'pointer',
          }}>← Edit answers</button>
          <button onClick={onRetry} style={{
            flex: 1, padding: '10px 0', borderRadius: 6, border: 'none',
            background: 'var(--signal)', color: '#0d0c0a',
            ...MONO, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>Try again</button>
        </div>
      </div>
    )
  }

  if (markdown) {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
          Wiki preview
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 20, lineHeight: 1.6 }}>
          Here's what we generated. If it looks right, continue to copy it into Cue.
        </p>

        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--line-soft)',
          borderRadius: 8, padding: '14px 16px',
          ...MONO, fontSize: 11, color: 'var(--ink-faint)',
          whiteSpace: 'pre-wrap', lineHeight: 1.65,
          maxHeight: 280, overflowY: 'auto', marginBottom: 24,
        }}>
          {markdown.slice(0, 400)}{markdown.length > 400 ? '\n…' : ''}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{
            padding: '10px 18px', borderRadius: 6,
            border: '1px solid var(--line)', background: 'var(--surface)',
            color: 'var(--ink-dim)', ...MONO, fontSize: 11, cursor: 'pointer',
          }}>← Edit answers</button>
          <button onClick={onSuccess} style={{
            flex: 1, padding: '10px 0', borderRadius: 6, border: 'none',
            background: 'var(--signal)', color: '#0d0c0a',
            ...MONO, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>Looks good →</button>
        </div>
      </div>
    )
  }

  return null
}
