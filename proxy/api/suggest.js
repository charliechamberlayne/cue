// api/suggest.js — Vercel serverless function
// POST { mode, context, wiki, transcript?, query?, userName }
// Returns { cards: [{id, label, sublabel, answer}] }

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, context, wiki, transcript, query, userName } = req.body ?? {};

  if (!mode || !wiki) {
    return res.status(400).json({ error: 'mode and wiki are required' });
  }

  // Quick-fire mode: extract likely question topics from the wiki
  if (mode === 'quickfire') {
    return handleQuickfire(wiki, res);
  }

  // Quick-fire answers: pre-generate answers for a set of button labels
  if (mode === 'quickfire-answers') {
    const { buttons } = req.body ?? {};
    return handleQuickfireAnswers(wiki, buttons ?? [], context ?? '', userName ?? 'the user', res);
  }

  const systemPrompt = buildSystemPrompt(userName ?? 'the user', context ?? '', wiki);
  const userMessage = mode === 'manual'
    ? `${userName ?? 'The user'} typed this question to answer privately: ${query}`
    : `Transcript (most recent last):\n${transcript}`;

  let raw;
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error('[Cue proxy] Anthropic error:', err);
      return res.status(502).json({ error: 'Upstream API error', detail: err });
    }

    const data = await anthropicRes.json();
    raw = data.content?.[0]?.text ?? '';
  } catch (err) {
    console.error('[Cue proxy] fetch error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }

  // Strip ```json fences defensively
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('[Cue proxy] JSON parse failed on:', cleaned);
    return res.status(200).json({ cards: [] });
  }

  const cards = (parsed.cards ?? []).slice(0, 3).map((card, i) => ({
    id:       card.id ?? `card-${Date.now()}-${i}`,
    label:    String(card.label ?? '').slice(0, 60),
    sublabel: String(card.sublabel ?? '').slice(0, 30),
    answer:   String(card.answer ?? ''),
  }));

  return res.status(200).json({ cards });
}

async function handleQuickfireAnswers(wiki, buttons, context, userName, res) {
  if (!buttons.length) return res.status(200).json({ answers: {} });

  // Build one batched prompt so we make a single API call for all buttons
  const labelsBlock = buttons.map((b, i) => `${i + 1}. ${b}`).join('\n');
  const systemPrompt = buildSystemPrompt(userName, context, wiki);
  const userMessage = `Pre-generate answers for these quick-reference buttons. For each button label, return a single answer card with the best answer from the company knowledge.

Button labels:
${labelsBlock}

Output ONLY valid JSON:
{"answers":{"<label>":{"label":"...","sublabel":"...","answer":"..."},...}}

Every label must appear as a key. If there is no relevant info for a label, use answer: "No information available." with sublabel "N/A".`;

  let raw;
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userMessage }],
      }),
    });
    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return res.status(502).json({ error: 'Upstream API error', detail: err });
    }
    const data = await anthropicRes.json();
    raw = data.content?.[0]?.text ?? '';
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }

  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return res.status(200).json({ answers: {} });
  }
  return res.status(200).json({ answers: parsed.answers ?? {} });
}

async function handleQuickfire(wiki, res) {
  let raw;
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: 'You identify broad conversation topics from a company knowledge base. Output ONLY valid JSON, no prose.',
        messages: [{
          role: 'user',
          content: `From the company knowledge below, identify the 5 broadest subject areas an investor or client would ask about in a meeting. These should be high-level themes, not specific facts or metrics — think "Revenue model" not "£60k MRR", "Team background" not "Founded in 2021".\n\nReturn them as short button labels (2–4 words each).\n\nOutput format: {"buttons":["Label one","Label two","Label three","Label four","Label five"]}\n\n--- COMPANY KNOWLEDGE ---\n${wiki}`,
        }],
      }),
    });
    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return res.status(502).json({ error: 'Upstream API error', detail: err });
    }
    const data = await anthropicRes.json();
    raw = data.content?.[0]?.text ?? '';
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }

  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return res.status(200).json({ buttons: [] });
  }
  const buttons = (parsed.buttons ?? []).slice(0, 5).map(b => String(b).slice(0, 40));
  return res.status(200).json({ buttons });
}

function buildSystemPrompt(userName, contextNote, wikiMarkdown) {
  return `You are Cue, a silent meeting copilot for ${userName}. You see a live transcript of a call.
When the OTHER party asks, or clearly implies, a question that ${userName} would answer using the company knowledge below, propose up to 3 candidate answer cards. Each card has:
- label: 2–5 words, what tapping it does (e.g. "Monthly burn rate")
- sublabel: one short tag for the source/type (e.g. "FINANCE", "CALCULATED", "DOC LINK")
- answer: a concise, glanceable answer drawn ONLY from the company knowledge below.

Rules:
- Only propose a card if you are at least 80% confident the other party is asking for a specific fact that ${userName} would answer.
- If nothing in the recent transcript warrants a card, return an empty array. This is the most common correct output.
- Short affirmations, pleasantries, small talk, and off-topic speech → always return [].
- Question words (what, how, when, who, why, where) directed at ${userName} are a strong signal.
- Never invent facts that are not in the company knowledge.
- You may synthesise multiple facts from the company knowledge into a single answer (e.g. summarising the investment case), but every claim must be grounded in the knowledge below.
- Do NOT invent facts, add opinions, or give advice that goes beyond what the knowledge supports.
- Output ONLY valid JSON, no prose: {"cards":[{"id":"...","label":"...","sublabel":"...","answer":"..."}]}

--- CALL CONTEXT ---
${contextNote}

--- COMPANY KNOWLEDGE ---
${wikiMarkdown}`;
}
