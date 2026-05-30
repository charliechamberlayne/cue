'use client'

import { useState, useMemo } from 'react'
import type { Seeds, Answer } from '../lib/types'
import { getQuestionsForStage, REQUIRED_IDS, type Topic } from '../lib/scaffold'

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function StepScaffold({ seeds, answers: initialAnswers, onSubmit, onBack }: {
  seeds: Seeds
  answers: Answer[]
  onSubmit: (answers: Answer[]) => void
  onBack: () => void
}) {
  const questions = useMemo(() => getQuestionsForStage(seeds.stage), [seeds.stage])

  const [answers, setAnswers] = useState<Answer[]>(() => {
    // Restore prior answers or initialise fresh
    return questions.map(q => {
      const prior = initialAnswers.find(a => a.questionId === q.id)
      return prior ?? { questionId: q.id, answer: '', skipped: false }
    })
  })

  const answeredCount = answers.filter(a => !a.skipped && a.answer.trim()).length
  const requiredAnswered = answers.filter(
    a => REQUIRED_IDS.has(a.questionId) && !a.skipped && a.answer.trim()
  ).length
  const canBuild = requiredAnswered >= REQUIRED_IDS.size

  function setAnswer(questionId: string, answer: string) {
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, answer, skipped: false } : a))
  }

  function toggleSkip(questionId: string) {
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, skipped: !a.skipped } : a))
  }

  // Group by topic
  const grouped = useMemo(() => {
    const map = new Map<Topic, typeof questions>()
    for (const q of questions) {
      const existing = map.get(q.topic) ?? []
      map.set(q.topic, [...existing, q])
    }
    return map
  }, [questions])

  const progressPct = Math.round((answeredCount / questions.length) * 100)

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
        Build your wiki
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 24, lineHeight: 1.6 }}>
        Answer what you can. Skip anything you're not ready for — it'll show as a gap in your wiki.
      </p>

      {/* Sticky progress bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', paddingBottom: 12, paddingTop: 4,
        borderBottom: '1px solid var(--line)', marginBottom: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ ...MONO, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
            Answered {answeredCount} of {questions.length} questions
          </span>
          <span style={{ ...MONO, fontSize: 10, color: requiredAnswered >= REQUIRED_IDS.size ? 'var(--signal)' : 'var(--ink-faint)', letterSpacing: '0.06em' }}>
            {requiredAnswered}/{REQUIRED_IDS.size} required
          </span>
        </div>
        <div style={{ height: 2, background: 'var(--surface-2)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${progressPct}%`,
            background: 'var(--signal)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Question groups */}
      {[...grouped.entries()].map(([topic, qs]) => (
        <div key={topic} style={{ marginBottom: 36 }}>
          <p style={{
            ...MONO, fontSize: 9, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--ink-faint)',
            borderBottom: '1px solid var(--line)', paddingBottom: 8, marginBottom: 16,
          }}>{topic}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {qs.map(q => {
              const ans = answers.find(a => a.questionId === q.id)!
              const isSkipped = ans.skipped
              return (
                <div
                  key={q.id}
                  style={{
                    background: 'var(--surface)',
                    border: `1px ${isSkipped ? 'dashed' : 'solid'} var(--line)`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    opacity: isSkipped ? 0.5 : 1,
                    transition: 'opacity 0.15s, border 0.15s',
                  }}
                >
                  {/* Question label row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.45, flex: 1 }}>
                        {q.text.replace('[company]', seeds.company || 'your company')}
                      </span>
                      {q.required && (
                        <span style={{
                          ...MONO, fontSize: 8, letterSpacing: '0.08em',
                          color: 'var(--signal)', border: '1px solid rgba(255,180,84,0.3)',
                          borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>Required</span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleSkip(q.id)}
                      style={{
                        ...MONO, fontSize: 10, letterSpacing: '0.04em',
                        background: 'none', border: 'none',
                        color: isSkipped ? 'var(--signal)' : 'var(--ink-faint)',
                        cursor: 'pointer', marginLeft: 12, flexShrink: 0, paddingTop: 1,
                      }}
                    >
                      {isSkipped ? 'Unskip' : 'Skip'}
                    </button>
                  </div>

                  {!isSkipped && (
                    <textarea
                      rows={3}
                      placeholder="Your answer…"
                      value={ans.answer}
                      onChange={e => setAnswer(q.id, e.target.value)}
                      style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.55 }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 18px', borderRadius: 6,
            border: '1px solid var(--line)',
            background: 'var(--surface)', color: 'var(--ink-dim)',
            ...MONO, fontSize: 11, letterSpacing: '0.04em', cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <button
          onClick={() => canBuild && onSubmit(answers)}
          disabled={!canBuild}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 6, border: 'none',
            ...MONO, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em',
            cursor: canBuild ? 'pointer' : 'not-allowed',
            background: canBuild ? 'var(--signal)' : 'var(--surface)',
            color: canBuild ? '#0d0c0a' : 'var(--ink-faint)',
            transition: 'all 0.15s',
          }}
        >
          {canBuild ? 'Build my wiki →' : `Answer ${REQUIRED_IDS.size - requiredAnswered} more required question${REQUIRED_IDS.size - requiredAnswered === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
