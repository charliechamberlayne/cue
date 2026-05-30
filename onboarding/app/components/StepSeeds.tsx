'use client'

import { useState } from 'react'
import type { Seeds, Stage } from '../lib/types'

const STAGES: { value: Stage; label: string }[] = [
  { value: 'preseed', label: 'Pre-seed' },
  { value: 'seed',    label: 'Seed' },
  { value: 'seriesA', label: 'Series A' },
]

const label = (text: string) => (
  <p style={{
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-faint)',
    marginBottom: 6,
  }}>{text}</p>
)

export default function StepSeeds({ seeds, onSubmit }: {
  seeds: Seeds
  onSubmit: (seeds: Seeds) => void
}) {
  const [form, setForm] = useState<Seeds>(seeds)

  const canSubmit = form.company.trim() && form.description.trim()

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
        Tell us about your company
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 36, lineHeight: 1.6 }}>
        Three quick questions. We'll use these to build your investor wiki.
      </p>

      {/* Company name */}
      <div style={{ marginBottom: 20 }}>
        {label('Company name')}
        <input
          type="text"
          placeholder="e.g. Iterum"
          value={form.company}
          onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
          autoFocus
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: 20 }}>
        {label('What does it do? (one line)')}
        <input
          type="text"
          placeholder="e.g. Appliance lifecycle management for institutional landlords"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      {/* Stage segmented control */}
      <div style={{ marginBottom: 36 }}>
        {label('Stage')}
        <div style={{ display: 'flex', gap: 6 }}>
          {STAGES.map(s => (
            <button
              key={s.value}
              onClick={() => setForm(f => ({ ...f, stage: s.value }))}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 6,
                border: '1px solid',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: form.stage === s.value ? 'var(--signal)' : 'var(--surface)',
                borderColor: form.stage === s.value ? 'var(--signal)' : 'var(--line)',
                color: form.stage === s.value ? '#0d0c0a' : 'var(--ink-dim)',
                fontWeight: form.stage === s.value ? 500 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => canSubmit && onSubmit(form)}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '11px 0',
          borderRadius: 6,
          border: 'none',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.06em',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          background: canSubmit ? 'var(--signal)' : 'var(--surface)',
          color: canSubmit ? '#0d0c0a' : 'var(--ink-faint)',
          borderColor: canSubmit ? 'var(--signal)' : 'var(--line)',
          transition: 'all 0.15s',
        }}
      >
        Continue →
      </button>
    </div>
  )
}
