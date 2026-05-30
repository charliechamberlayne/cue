import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are building a meeting-ready company wiki for a founder who is raising money.
You will receive their company details and their answers to a set of investor questions,
some of which may be incomplete or skipped.

Your job is to reformat their answers into a clean, structured markdown wiki optimised
for retrieval during live investor calls. Follow these rules:

- Every answered question becomes an explicit Q&A pair under the right section header
- Write answers in the first person voice of the founder ("We are...", "Our ARR is...")
- Be specific — if they gave a number, keep the number; do not generalise
- For skipped questions, include the question with "Answer not yet added." as a placeholder
- Do not invent facts. Do not fill in blanks. Do not add context they didn't provide.
- Output clean markdown only — no preamble, no commentary

Structure the output in this order:
1. Company snapshot (1 short paragraph synthesised from their description)
2. Metrics & traction
3. The fundraise
4. Product
5. Market & timing
6. Competition & moat
7. Team
8. FAQs (all Q&A pairs, including gaps marked as placeholders)`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, description, stage, answers } = body

    if (!company || !answers) {
      return NextResponse.json({ error: 'company and answers are required' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const userContent = JSON.stringify({ company, description, stage, answers }, null, 2)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const markdown = (message.content[0] as { type: string; text: string }).text

    return NextResponse.json({ markdown })
  } catch (err) {
    console.error('[/api/build]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
