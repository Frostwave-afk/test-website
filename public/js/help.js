/**
 * help.js — Help page logic
 */

window.addEventListener('DOMContentLoaded', () => {
  // Help page is accessible without login (for convenience)
  // But show navbar user info if logged in
  if (Auth.isLoggedIn()) {
    setUserInitials();
  } else {
    // Hide user avatar and show login link
    const userEl = document.getElementById('userAvatar');
    if (userEl) userEl.style.display = 'none';
  }
});

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
function toggleFAQ(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

  // Open clicked if it was closed
  if (!isOpen) item.classList.add('open');
}

// ── FAQ Search ────────────────────────────────────────────────────────────────
function filterFAQ(query) {
  const q = query.toLowerCase().trim();
  const items = document.querySelectorAll('#faqList .faq-item');
  let found = 0;

  items.forEach(item => {
    const text = (item.dataset.question || '') + item.querySelector('.faq-question').textContent.toLowerCase();
    const match = !q || text.includes(q);
    item.style.display = match ? '' : 'none';
    if (match) found++;
  });

  // Show no results message
  let noResult = document.getElementById('faqNoResult');
  if (!noResult) {
    noResult = document.createElement('p');
    noResult.id = 'faqNoResult';
    noResult.style.cssText = 'color:var(--text-muted);text-align:center;padding:24px;font-size:0.875rem;';
    document.getElementById('faqList').appendChild(noResult);
  }
  noResult.textContent = found === 0 ? `No results found for "${query}". Try different keywords.` : '';
  noResult.style.display = found === 0 ? '' : 'none';
}
