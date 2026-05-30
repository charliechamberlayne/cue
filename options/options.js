// options.js — load/save all settings via chrome.storage.sync

const KEYS = ['userName', 'wikiUrl', 'wiki', 'debounceMs'];

const els = {
  userName:   document.getElementById('user-name'),
  wikiUrl:    document.getElementById('wiki-url'),
  wiki:       document.getElementById('wiki'),
  debounceMs: document.getElementById('debounce-ms'),
};

const wikiFetchStatus = document.getElementById('wiki-fetch-status');
const wikiPreview     = document.getElementById('wiki-preview');

chrome.storage.sync.get(KEYS, (data) => {
  for (const [key, el] of Object.entries(els)) {
    if (data[key]) el.value = data[key];
  }
  // Show last-fetched timestamp if available
  chrome.storage.local.get(['wikiFetchedAt'], (local) => {
    if (local.wikiFetchedAt) {
      wikiFetchStatus.textContent = `Last fetched: ${new Date(local.wikiFetchedAt).toLocaleString()}`;
    }
  });
});

// ── Fetch & preview button ────────────────────────────────────────────────
document.getElementById('fetch-wiki').addEventListener('click', async () => {
  const url = els.wikiUrl.value.trim();
  if (!url) { wikiFetchStatus.textContent = 'Enter a URL first.'; return; }

  wikiFetchStatus.textContent = 'Fetching…';
  wikiPreview.style.display = 'none';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // Show preview of first 300 chars
    wikiPreview.textContent = text.slice(0, 300) + (text.length > 300 ? '…' : '');
    wikiPreview.style.display = 'block';

    // Populate the textarea
    els.wiki.value = text;

    // Cache in local storage with timestamp
    const fetchedAt = Date.now();
    chrome.storage.local.set({ wikiUrlContent: text, wikiFetchedAt: fetchedAt });
    chrome.storage.sync.set({ wikiUrl: url });
    wikiFetchStatus.textContent = `Fetched ${text.length} chars — ${new Date(fetchedAt).toLocaleString()}`;
  } catch (err) {
    wikiFetchStatus.textContent = `Fetch failed: ${err.message}`;
  }
});

document.getElementById('save').addEventListener('click', () => {
  const values = {};
  for (const [key, el] of Object.entries(els)) {
    values[key] = el.value.trim();
  }
  chrome.storage.sync.set(values, () => {
    const statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Saved ✓';
    setTimeout(() => { statusEl.textContent = ''; }, 2500);
  });
});
