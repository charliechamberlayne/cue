export type Stage = 'preseed' | 'seed' | 'seriesA'

export type Seeds = {
  company: string
  description: string
  stage: Stage
}

export type Answer = {
  questionId: string
  answer: string
  skipped: boolean
}

export type AppState = {
  step: 1 | 2 | 3 | 4
  seeds: Seeds
  answers: Answer[]
  generatedMarkdown: string
  building: boolean
  buildError: string
}
