/* Shared appearance and navigation; no helper or task content is persisted. */
(function () {
  'use strict';
  const key = 'skillforge-appearance';
  let choice = 'system';
  try { choice = localStorage.getItem(key) || 'system'; } catch (_) {}
  if (!['light', 'dark', 'system'].includes(choice)) choice = 'system';
  document.documentElement.dataset.forgeTheme = choice;
  document.addEventListener('DOMContentLoaded', () => {
    const picker = document.getElementById('forge-theme');
    if (picker) {
      picker.value = choice;
      picker.addEventListener('change', () => {
        document.documentElement.dataset.forgeTheme = picker.value;
        try { localStorage.setItem(key, picker.value); } catch (_) {}
      });
    }
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-navigation');
    const narrow = matchMedia('(max-width: 600px)');
    const layout = () => {
      toggle.hidden = !narrow.matches;
      nav.hidden = narrow.matches;
      toggle.setAttribute('aria-expanded', String(!nav.hidden));
    };
    if (toggle && nav) {
      layout();
      narrow.addEventListener('change', layout);
      toggle.addEventListener('click', () => {
        nav.hidden = !nav.hidden;
        toggle.setAttribute('aria-expanded', String(!nav.hidden));
      });
    }
    document.querySelectorAll('a[href="#catalog-panel"]').forEach(link => {
      link.addEventListener('click', () => {
        const catalog = document.getElementById('catalog-panel');
        if (catalog) catalog.open = true;
      });
    });
    document.querySelectorAll('[data-copy-prompt]').forEach(button => {
      button.addEventListener('click', async () => {
        const source = document.getElementById(button.dataset.copyPrompt);
        const status = document.getElementById(button.dataset.copyPrompt + '-status');
        try {
          await navigator.clipboard.writeText(source.textContent.trim());
          status.textContent = 'Copied. Paste it into your assistant.';
        } catch (_) {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(source);
          selection.removeAllRanges(); selection.addRange(range);
          status.textContent = 'Text selected. Copy it with your keyboard or selection menu.';
        }
      });
    });
  });
})();
