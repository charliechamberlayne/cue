'use client'

import { useState } from 'react'
import type { AppState, Answer } from './lib/types'
import { getQuestionsForStage } from './lib/scaffold'
import StepSeeds from './components/StepSeeds'
import StepScaffold from './components/StepScaffold'
import StepGenerate from './components/StepGenerate'
import StepHandoff from './components/StepHandoff'

const initialState: AppState = {
  step: 1,
  seeds: { company: '', description: '', stage: 'seed' },
  answers: [],
  generatedMarkdown: '',
  building: false,
  buildError: '',
}

export default function Home() {
  const [state, setState] = useState<AppState>(initialState)

  async function handleBuild(answers: Answer[]) {
    setState(s => ({ ...s, step: 3, answers, building: true, buildError: '', generatedMarkdown: '' }))
    try {
      const questions = getQuestionsForStage(state.seeds.stage)
      const payload = {
        company: state.seeds.company,
        description: state.seeds.description,
        stage: state.seeds.stage,
        answers: answers.map(a => {
          const q = questions.find(q => q.id === a.questionId)
          return {
            question: q?.text.replace('[company]', state.seeds.company) ?? a.questionId,
            topic: q?.topic ?? '',
            answer: a.answer,
            skipped: a.skipped,
          }
        }),
      }
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setState(s => ({ ...s, building: false, generatedMarkdown: data.markdown }))
    } catch (err) {
      setState(s => ({ ...s, building: false, buildError: (err as Error).message }))
    }
  }

  function handleRetry() {
    handleBuild(state.answers)
  }

  return (
    <main className="min-h-screen relative" style={{ zIndex: 1 }}>
      {/* Header */}
      <header className="flex items-center gap-2.5 px-6 pt-8 pb-0 max-w-2xl mx-auto">
        <span
          className="animate-pulse-dot flex-shrink-0 rounded-full"
          style={{ width: 8, height: 8, background: 'var(--signal)', display: 'inline-block' }}
        />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase' as const,
          color: 'var(--ink)',
        }}>
          Cue
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-10 pb-24">
        {/* Step indicator */}
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: 'var(--ink-faint)',
          marginBottom: 32,
        }}>
          Step {state.step} of 4
        </p>

        {state.step === 1 && (
          <StepSeeds
            seeds={state.seeds}
            onSubmit={(seeds) => setState(s => ({ ...s, step: 2, seeds }))}
          />
        )}
        {state.step === 2 && (
          <StepScaffold
            seeds={state.seeds}
            answers={state.answers}
            onSubmit={handleBuild}
            onBack={() => setState(s => ({ ...s, step: 1 }))}
          />
        )}
        {state.step === 3 && (
          <StepGenerate
            building={state.building}
            error={state.buildError}
            markdown={state.generatedMarkdown}
            onSuccess={() => setState(s => ({ ...s, step: 4 }))}
            onBack={() => setState(s => ({ ...s, step: 2 }))}
            onRetry={handleRetry}
          />
        )}
        {state.step === 4 && (
          <StepHandoff
            markdown={state.generatedMarkdown}
            onRegenerate={() => setState(s => ({ ...s, step: 2 }))}
          />
        )}
      </div>
    </main>
  )
}
