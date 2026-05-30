import type { Stage } from './types'

export type Topic =
  | 'COMPANY'
  | 'TRACTION'
  | 'FUNDRAISE'
  | 'TEAM'
  | 'MARKET'
  | 'PRODUCT'
  | 'COMPETITION'
  | 'BUSINESS MODEL'
  | 'INVESTMENT RATIONALE'
  | 'METRICS'
  | 'GO TO MARKET'

export type Question = {
  id: string
  topic: Topic
  text: string       // [company] replaced at render time
  required: boolean
  stages: Stage[]
}

const ALL: Stage[] = ['preseed', 'seed', 'seriesA']
const SEED_PLUS: Stage[] = ['seed', 'seriesA']
const SERIES_A: Stage[] = ['seriesA']

export const questions: Question[] = [
  // ── COMPANY (core) ──────────────────────────────────────────────────────
  { id: 'company-what',     topic: 'COMPANY',   text: 'What does [company] do?',                                         required: true,  stages: ALL },
  { id: 'company-problem',  topic: 'COMPANY',   text: 'What problem does it solve, and for whom?',                       required: true,  stages: ALL },

  // ── TRACTION (core) ─────────────────────────────────────────────────────
  { id: 'traction-metrics', topic: 'TRACTION',  text: 'What are your key metrics? (MRR/ARR, growth rate, units, users)', required: true,  stages: ALL },
  { id: 'traction-customers',topic:'TRACTION',  text: 'Who are your current customers or users?',                        required: true,  stages: ALL },
  { id: 'traction-growth',  topic: 'TRACTION',  text: 'What is your month-on-month growth rate?',                        required: false, stages: SEED_PLUS },

  // ── FUNDRAISE (core) ────────────────────────────────────────────────────
  { id: 'fundraise-amount', topic: 'FUNDRAISE', text: 'How much are you raising and on what terms?',                     required: true,  stages: ALL },
  { id: 'fundraise-use',    topic: 'FUNDRAISE', text: 'What will you use the money for?',                                required: true,  stages: ALL },
  { id: 'fundraise-runway', topic: 'FUNDRAISE', text: 'How long does this give you and what milestones does it get you to?', required: true, stages: ALL },

  // ── TEAM (core) ─────────────────────────────────────────────────────────
  { id: 'team-founders',    topic: 'TEAM',      text: 'Who are the founders and why are you the right team to build this?', required: true, stages: ALL },

  // ── MARKET ──────────────────────────────────────────────────────────────
  { id: 'market-size',      topic: 'MARKET',    text: 'How big is the market?',                                          required: false, stages: ALL },
  { id: 'market-timing',    topic: 'MARKET',    text: 'Why is now the right time for this?',                             required: false, stages: ALL },

  // ── PRODUCT ─────────────────────────────────────────────────────────────
  { id: 'product-today',    topic: 'PRODUCT',   text: 'What does the product do today?',                                 required: false, stages: ALL },
  { id: 'product-roadmap',  topic: 'PRODUCT',   text: 'What\'s on the roadmap for the next 6 months?',                  required: false, stages: SEED_PLUS },

  // ── COMPETITION ─────────────────────────────────────────────────────────
  { id: 'comp-who',         topic: 'COMPETITION', text: 'Who are your competitors?',                                     required: false, stages: SEED_PLUS },
  { id: 'comp-moat',        topic: 'COMPETITION', text: 'What\'s your competitive advantage or moat?',                  required: false, stages: SEED_PLUS },
  { id: 'comp-incumbents',  topic: 'COMPETITION', text: 'Why haven\'t the big players built this?',                     required: false, stages: SEED_PLUS },

  // ── BUSINESS MODEL ──────────────────────────────────────────────────────
  { id: 'biz-model',        topic: 'BUSINESS MODEL', text: 'How do you make money?',                                    required: false, stages: ALL },
  { id: 'biz-pricing',      topic: 'BUSINESS MODEL', text: 'What does a typical customer pay?',                        required: false, stages: SEED_PLUS },
  { id: 'biz-unit-econ',    topic: 'BUSINESS MODEL', text: 'What are your unit economics? (CAC, LTV, payback period)',  required: false, stages: SEED_PLUS },

  // ── INVESTMENT RATIONALE ────────────────────────────────────────────────
  { id: 'invest-why',       topic: 'INVESTMENT RATIONALE', text: 'Why should someone invest in [company]?',             required: false, stages: ALL },
  { id: 'invest-success',   topic: 'INVESTMENT RATIONALE', text: 'What does success look like in 3 years?',            required: false, stages: ALL },
  { id: 'invest-risk',      topic: 'INVESTMENT RATIONALE', text: 'What\'s the biggest risk, and how are you thinking about it?', required: false, stages: ALL },

  // ── METRICS DEEP (Series A) ─────────────────────────────────────────────
  { id: 'metrics-churn',    topic: 'METRICS',   text: 'What is your monthly/annual churn?',                             required: false, stages: SERIES_A },
  { id: 'metrics-nrr',      topic: 'METRICS',   text: 'What is your net revenue retention?',                            required: false, stages: SERIES_A },
  { id: 'metrics-margins',  topic: 'METRICS',   text: 'What are your gross margins?',                                   required: false, stages: SERIES_A },
  { id: 'metrics-trend',    topic: 'METRICS',   text: 'How has growth trended over the last 6 months?',                 required: false, stages: SERIES_A },

  // ── GO TO MARKET (Series A) ─────────────────────────────────────────────
  { id: 'gtm-channels',     topic: 'GO TO MARKET', text: 'What are your primary acquisition channels?',                 required: false, stages: SERIES_A },
  { id: 'gtm-sales',        topic: 'GO TO MARKET', text: 'What does your sales process look like?',                    required: false, stages: SERIES_A },
  { id: 'gtm-cycle',        topic: 'GO TO MARKET', text: 'What\'s your average sales cycle and deal size?',            required: false, stages: SERIES_A },

  // ── FUNDRAISE DEEP (Series A) ───────────────────────────────────────────
  { id: 'fundraise-others', topic: 'FUNDRAISE', text: 'Who else is in this round?',                                     required: false, stages: SERIES_A },
  { id: 'fundraise-cap',    topic: 'FUNDRAISE', text: 'What does your cap table look like?',                            required: false, stages: SERIES_A },
  { id: 'fundraise-prev',   topic: 'FUNDRAISE', text: 'What have previous investors said about the business?',          required: false, stages: SERIES_A },
]

export function getQuestionsForStage(stage: Stage): Question[] {
  return questions.filter(q => q.stages.includes(stage))
}

export const REQUIRED_IDS = new Set(
  questions.filter(q => q.required).map(q => q.id)
)
