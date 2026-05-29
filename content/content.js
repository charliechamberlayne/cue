// content/content.js — Phase 2: caption scraping with MutationObserver

// ── Selector constants — update here if Meet changes its DOM ─────────────
const CAPTION_CONTAINER_SELECTOR = '[aria-label="Captions"]';
const CAPTION_TEXT_SELECTOR = '.ygicle';   // the spoken text span
const SPEAKER_SELECTOR = '.NWpY1d';        // speaker name span
// ─────────────────────────────────────────────────────────────────────────

const MAX_BUFFER_CHARS = 1500;
const MAX_BUFFER_AGE_MS = 40_000;

/** @type {Array<{speaker: string, text: string, timestamp: number}>} */
let buffer = [];
let lastSentFingerprint = '';

function findCaptionContainer() {
  return document.querySelector(CAPTION_CONTAINER_SELECTOR);
}

function extractCurrentLines(container) {
  const lines = [];
  // Each caption block is a div holding both a speaker el and a text el.
  // Structure: .nMcdL > .adE6rb > .NWpY1d (speaker)
  //            .nMcdL > .ygicle (text)
  const textEls = container.querySelectorAll(CAPTION_TEXT_SELECTOR);
  for (const textEl of textEls) {
    const text = textEl.textContent.trim();
    if (!text) continue;
    // Walk up to the caption block, then find the speaker inside it
    const block = textEl.closest('.nMcdL') ?? textEl.parentElement;
    const speakerEl = block?.querySelector(SPEAKER_SELECTOR);
    const speaker = speakerEl
      ? speakerEl.textContent.trim().replace(/:$/, '').trim()
      : 'Unknown';
    lines.push({ speaker, text });
  }
  return lines;
}

function pruneBuffer() {
  const now = Date.now();
  buffer = buffer.filter(e => now - e.timestamp < MAX_BUFFER_AGE_MS);
  let totalChars = buffer.reduce((sum, e) => sum + e.speaker.length + e.text.length + 2, 0);
  while (buffer.length > 0 && totalChars > MAX_BUFFER_CHARS) {
    const removed = buffer.shift();
    totalChars -= removed.speaker.length + removed.text.length + 2;
  }
}

function onMutation() {
  const container = findCaptionContainer();
  if (!container) return;

  const lines = extractCurrentLines(container);
  if (lines.length === 0) return;

  const last = lines[lines.length - 1];
  const fingerprint = last.speaker + '::' + last.text;
  if (fingerprint === lastSentFingerprint) return;
  lastSentFingerprint = fingerprint;

  const now = Date.now();
  // Update last buffer entry in-place if same speaker is still mid-sentence,
  // otherwise push a new entry
  if (buffer.length > 0 && buffer[buffer.length - 1].speaker === last.speaker) {
    buffer[buffer.length - 1] = { ...last, timestamp: now };
  } else {
    buffer.push({ ...last, timestamp: now });
  }

  pruneBuffer();

  sendMessage({
    type: 'TRANSCRIPT_UPDATE',
    buffer,
    lastSpeaker: last.speaker,
    lastText: last.text,
  });
}

function sendMessage(msg) {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
  chrome.runtime.sendMessage(msg).catch(() => {});
}

// Only run in the top-level Meet frame, not in embedded iframes
if (window === window.top) {
  const observer = new MutationObserver(onMutation);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // After 6s, if captions container still not found, send nudge
  setTimeout(() => {
    if (!findCaptionContainer()) {
      sendMessage({ type: 'CAPTIONS_NOT_FOUND' });
    }
  }, 6000);

  // Watch for captions being toggled off mid-call
  let captionsWerePresent = false;
  setInterval(() => {
    const present = !!findCaptionContainer();
    if (captionsWerePresent && !present) {
      sendMessage({ type: 'CAPTIONS_NOT_FOUND' });
    }
    captionsWerePresent = present;
  }, 3000);

  console.log('[Cue] caption scraper ready');
}
