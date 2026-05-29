// service-worker.js — Phase 3: suggest loop

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// ── Wiki URL background fetch (on startup + hourly) ──────────────────────
chrome.runtime.onStartup.addListener(fetchWikiUrl);
chrome.runtime.onInstalled.addListener(fetchWikiUrl);

// Alarm for hourly refresh
chrome.alarms.create('wikiRefresh', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'wikiRefresh') fetchWikiUrl();
});

async function fetchWikiUrl() {
  const { wikiUrl } = await chromeStorageGet(['wikiUrl']);
  const url = wikiUrl || DEFAULT_WIKI_URL;
  if (!url) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    await new Promise(resolve => chrome.storage.local.set(
      { wikiUrlContent: text, wikiFetchedAt: Date.now() }, resolve
    ));
    console.log('[Cue SW] wiki refreshed from URL, length:', text.length);
  } catch (err) {
    console.warn('[Cue SW] wiki URL fetch failed:', err.message);
    broadcast({ type: 'WIKI_FETCH_ERROR', error: err.message });
  }
}

// ── State ────────────────────────────────────────────────────────────────
let debounceTimer = null;
const DEBOUNCE_MS = 2500;
let lastTranscriptSent = '';

const DEFAULT_PROXY_URL = 'https://cue-proxy.vercel.app/api/suggest';
const DEFAULT_WIKI_URL  = 'https://gist.githubusercontent.com/charliechamberlayne/21bf65ab18dad9bff471bdd58e17fd7b/raw/e598ec9130b95cc3f0cb185a98ee751525c96639/gistfile1.txt';


// ── Message router ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSCRIPT_UPDATE') {
    // Relay raw buffer to side panel for the live status counter
    chrome.runtime.sendMessage(message).catch(() => {});
    handleTranscriptUpdate(message);
    sendResponse({ ok: true });
    return false;
  }
  if (message.type === 'MANUAL_QUESTION') {
    // Wrap bare topic labels in a question so the prompt treats them correctly
    const query = message.query.trim();
    const isQuestion = query.endsWith('?') || /^(what|how|when|who|why|where|can|is|are|do|does)\b/i.test(query);
    handleManualQuestion({ query: isQuestion ? query : `What can you tell me about ${query}?` });
    sendResponse({ ok: true });
    return false;
  }
  sendResponse({ ok: true });
  return false;
});

// ── Transcript trigger ───────────────────────────────────────────────────
function handleTranscriptUpdate({ buffer, lastSpeaker, lastText }) {
  chrome.storage.sync.get(['userName', 'debounceMs'], (data) => {
    const myName = (data.userName ?? '').toLowerCase().trim();

    // Ignore own speech. Meet labels your own captions as "You" when name isn't set;
    // also check against the configured name.
    const speakerLower = lastSpeaker.toLowerCase();
    if (speakerLower === 'you') return;
    if (myName && speakerLower.includes(myName)) return;

    const hasQuestion = lastText.includes('?');
    const wordCount = lastText.trim().split(/\s+/).length;

    // Skip short utterances that aren't questions — filters "Yeah", "Sure", "Right", etc.
    if (!hasQuestion && wordCount < 8) return;

    const debounceMs = parseInt(data.debounceMs ?? String(DEBOUNCE_MS), 10) || DEBOUNCE_MS;

    // Immediate trigger on a question mark; otherwise debounce
    clearTimeout(debounceTimer);
    if (hasQuestion) {
      triggerSuggest(buffer);
    } else {
      debounceTimer = setTimeout(() => triggerSuggest(buffer), debounceMs);
    }
  });
}

async function resolveWiki(settings, local) {
  // URL-fetched content takes priority over the manual textarea
  if (local.wikiUrlContent) return local.wikiUrlContent;
  return settings.wiki || '';
}

async function triggerSuggest(buffer) {
  const transcript = buffer.map(e => `[${e.speaker}] ${e.text}`).join('\n');
  if (transcript === lastTranscriptSent) return;
  lastTranscriptSent = transcript;

  broadcast({ type: 'CARDS_LOADING' });

  try {
    const settings = await chromeStorageGet(['userName', 'proxyUrl', 'defaultContext', 'wiki', 'apiKey']);
    const local    = await chromeStorageLocalGet(['callContext', 'wikiUrlContent']);
    const context  = local.callContext || settings.defaultContext || '';
    const wiki     = await resolveWiki(settings, local);

    const cards = await callProxy({
      mode: 'listen',
      context,
      wiki,
      transcript,
      userName: settings.userName || 'the user',
      proxyUrl: settings.proxyUrl || '',
      apiKey:   settings.apiKey   || '',
    });
    broadcast({ type: 'CARDS_RESULT', cards, source: 'listen' });
  } catch (err) {
    console.error('[Cue SW] suggest error:', err);
    broadcast({ type: 'CARDS_ERROR', error: err.message });
  }
}

// ── Manual question ──────────────────────────────────────────────────────
async function handleManualQuestion({ query }) {
  broadcast({ type: 'CARDS_LOADING' });

  try {
    const settings = await chromeStorageGet(['userName', 'proxyUrl', 'defaultContext', 'wiki', 'apiKey']);
    const local    = await chromeStorageLocalGet(['callContext', 'wikiUrlContent']);
    const context  = local.callContext || settings.defaultContext || '';
    const wiki     = await resolveWiki(settings, local);

    const cards = await callProxy({
      mode: 'manual',
      context,
      wiki,
      query,
      userName: settings.userName || 'the user',
      proxyUrl: settings.proxyUrl || '',
      apiKey:   settings.apiKey   || '',
    });
    broadcast({ type: 'CARDS_RESULT', cards, source: 'manual' });
  } catch (err) {
    broadcast({ type: 'CARDS_ERROR', error: err.message });
  }
}

// ── Proxy call ───────────────────────────────────────────────────────────
async function callProxy({ mode, context, wiki, transcript, query, userName, proxyUrl, apiKey }) {
  const resolvedUrl = proxyUrl || DEFAULT_PROXY_URL;

  if (resolvedUrl) {
    const res = await fetch(resolvedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, context, wiki, transcript, query, userName }),
    });
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    const data = await res.json();
    return data.cards ?? [];
  }

  if (apiKey) {
    // Solo fallback — direct Anthropic call (not for distribution)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: buildSystemPromptFallback(userName, context, wiki),
        messages: [{ role: 'user', content: mode === 'manual'
          ? `${userName} typed this question to answer privately: ${query}`
          : `Transcript (most recent last):\n${transcript}` }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
    const data = await res.json();
    const raw = data.content?.[0]?.text ?? '';
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return (parsed.cards ?? []).slice(0, 3).map((c, i) => ({
      id: `card-${Date.now()}-${i}`,
      label: String(c.label ?? '').slice(0, 60),
      sublabel: String(c.sublabel ?? '').slice(0, 30),
      answer: String(c.answer ?? ''),
    }));
  }

  throw new Error('No proxy URL or API key configured. Open Settings to add one.');
}

function buildSystemPromptFallback(userName, contextNote, wiki) {
  return `You are Cue, a silent meeting copilot for ${userName}.
Propose up to 3 answer cards when the other party asks something ${userName} can answer from the knowledge below.
Output ONLY valid JSON: {"cards":[{"id":"...","label":"...","sublabel":"...","answer":"..."}]}
Return [] if nothing warrants a card.
--- CALL CONTEXT ---\n${contextNote}\n--- COMPANY KNOWLEDGE ---\n${wiki}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function broadcast(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}

function chromeStorageGet(keys) {
  return new Promise(resolve => chrome.storage.sync.get(keys, resolve));
}

function chromeStorageLocalGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}
