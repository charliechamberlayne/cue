// sidepanel.js — Phase 3: card rendering + manual question

// ── Settings link ─────────────────────────────────────────────────────────
document.getElementById('open-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Call context persistence ──────────────────────────────────────────────
const contextEl = document.getElementById('context-input');
chrome.storage.local.get(['callContext'], (local) => {
  if (local.callContext && local.callContext.trim()) {
    contextEl.value = local.callContext;
  } else {
    // Pre-fill from the default set in Settings
    chrome.storage.sync.get(['defaultContext'], (sync) => {
      if (sync.defaultContext) contextEl.value = sync.defaultContext;
    });
  }
});
contextEl.addEventListener('input', () => {
  chrome.storage.local.set({ callContext: contextEl.value });
});

// ── Manual question ───────────────────────────────────────────────────────
document.getElementById('question-submit').addEventListener('click', sendManualQuestion);
document.getElementById('question-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendManualQuestion();
});

function sendManualQuestion() {
  const q = document.getElementById('question-input').value.trim();
  if (!q) return;
  chrome.runtime.sendMessage({ type: 'MANUAL_QUESTION', query: q });
  document.getElementById('question-input').value = '';
}

// ── Quick-fire buttons ────────────────────────────────────────────────────
const DEFAULT_QUICKFIRE = ['Burn rate', 'Runway', 'Client count', 'Raise details', 'ARPU'];
const quickfireRow = document.getElementById('quickfire-row');
let activeQfBtn = null;
let quickfireCacheReady = false;

function renderQuickfireButtons(labels, cacheReady) {
  quickfireRow.innerHTML = '';
  labels.forEach(label => {
    const btn = document.createElement('button');
    btn.className = 'qf-btn' + (cacheReady ? ' cached' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('loading')) return;
      // Only show loading spinner if cache is not ready
      if (!quickfireCacheReady) {
        btn.classList.add('loading');
        btn.textContent = label + '…';
        activeQfBtn = { btn, label };
      } else {
        activeQfBtn = { btn, label };
      }
      chrome.runtime.sendMessage({ type: 'QUICKFIRE_CLICK', label });
    });
    quickfireRow.appendChild(btn);
  });
}

function clearQfLoading() {
  if (!activeQfBtn) return;
  activeQfBtn.btn.classList.remove('loading');
  activeQfBtn.btn.textContent = activeQfBtn.label;
  activeQfBtn = null;
}

// Load from local (wiki-derived) or sync (user-set), fall back to defaults
function loadQuickfireButtons() {
  chrome.storage.local.get(['quickfireButtons', 'quickfireCache'], (local) => {
    const labels = Array.isArray(local.quickfireButtons) && local.quickfireButtons.length
      ? local.quickfireButtons
      : DEFAULT_QUICKFIRE;
    quickfireCacheReady = !!(local.quickfireCache && Object.keys(local.quickfireCache).length > 0);
    renderQuickfireButtons(labels, quickfireCacheReady);
  });
}
loadQuickfireButtons();

// ── Card rendering ────────────────────────────────────────────────────────
const cardsZone   = document.getElementById('zone-cards');
const statusEl    = document.getElementById('status');
const historyFeed = document.getElementById('zone-history');
const liveBadge   = document.getElementById('live-badge');

const sessionHistory = []; // resets when panel closes — no persistence needed
const MAX_HISTORY = 5;

function setStatus(text, amber = false) {
  statusEl.textContent = text;
  statusEl.style.display = 'block';
  statusEl.style.color = amber ? '#f6ad55' : '';
}

function renderHistory() {
  historyFeed.innerHTML = '';
  if (sessionHistory.length === 0) return;

  const sep = document.createElement('div');
  sep.id = 'history-separator';
  sep.innerHTML = '<span>Earlier this call</span>';
  historyFeed.appendChild(sep);

  // Newest first
  [...sessionHistory].reverse().forEach(entry => {
    const el = document.createElement('div');
    el.className = 'history-card';
    el.innerHTML = `
      <div class="history-card-label">${escapeHtml(entry.label)}</div>
      <div class="history-card-answer">${escapeHtml(entry.answer)}</div>
    `;
    historyFeed.appendChild(el);
  });
}

function renderCards(cards, source) {
  cardsZone.querySelectorAll('.card').forEach(el => el.remove());

  if (!cards || cards.length === 0) {
    setStatus('Listening… (no suggestions)');
    return;
  }

  statusEl.style.display = 'none';

  cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'card' + (source === 'manual' ? ' manual' : '');
    el.innerHTML = `
      <div class="card-label">${escapeHtml(card.label)}</div>
      <div class="card-sublabel">${escapeHtml(card.sublabel)}</div>
      <div class="card-answer">${escapeHtml(card.answer)}</div>
    `;
    el.addEventListener('click', () => {
      const wasExpanded = el.classList.contains('expanded');
      el.classList.toggle('expanded');
      // Push to history on first reveal
      if (!wasExpanded) {
        sessionHistory.push({ label: card.label, answer: card.answer });
        if (sessionHistory.length > MAX_HISTORY) sessionHistory.shift();
        renderHistory();
      }
    });
    cardsZone.appendChild(el);
  });
}

// ── Message handler ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'TRANSCRIPT_UPDATE':
      liveBadge.classList.add('visible');
      setStatus(`Live — ${message.buffer.length} lines`);
      break;
    case 'CAPTIONS_NOT_FOUND':
      liveBadge.classList.remove('visible');
      setStatus('Enable captions to start Cue — click CC in the Meet toolbar.', true);
      break;
    case 'CARDS_LOADING':
      setStatus('Thinking…');
      break;
    case 'CARDS_RESULT':
      clearQfLoading();
      renderCards(message.cards, message.source);
      break;
    case 'CARDS_ERROR':
      clearQfLoading();
      setStatus(`Error: ${message.error}`);
      break;
    case 'QUICKFIRE_BUTTONS':
      // New wiki-derived buttons just arrived — re-render without cache dot yet
      quickfireCacheReady = false;
      renderQuickfireButtons(message.buttons, false);
      break;
    case 'QUICKFIRE_CACHE_READY':
      // Answers pre-warmed — mark buttons as instant
      quickfireCacheReady = true;
      loadQuickfireButtons();
      break;
  }
});

// ── Utility ───────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
