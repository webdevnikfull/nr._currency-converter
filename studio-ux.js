(() => {
  'use strict';

  const UI = window.ToolUI;
  const app = document.body.dataset.app;
  const words = {
    pl: { local: 'Czas lokalny', quick: 'Szybka kwota', pairs: 'Popularne pary', copy: 'Kopiuj wynik', copied: 'Wynik skopiowany', copyFailed: 'Nie udało się skopiować wyniku', goal: 'Cel słów', progress: 'Wykonano', focus: 'Tryb skupienia', leave: 'Pokaż statystyki', heroCurrency: 'KURSY REFERENCYJNE', heroText: 'ANALIZA W PRZEGLĄDARCE' },
    en: { local: 'Local time', quick: 'Quick amount', pairs: 'Popular pairs', copy: 'Copy result', copied: 'Result copied', copyFailed: 'Could not copy the result', goal: 'Word goal', progress: 'Completed', focus: 'Focus mode', leave: 'Show statistics', heroCurrency: 'REFERENCE RATES', heroText: 'IN-BROWSER ANALYSIS' },
    de: { local: 'Ortszeit', quick: 'Schneller Betrag', pairs: 'Beliebte Paare', copy: 'Ergebnis kopieren', copied: 'Ergebnis kopiert', copyFailed: 'Ergebnis konnte nicht kopiert werden', goal: 'Wortziel', progress: 'Erreicht', focus: 'Fokusmodus', leave: 'Statistik anzeigen', heroCurrency: 'REFERENZKURSE', heroText: 'ANALYSE IM BROWSER' },
    uk: { local: 'Місцевий час', quick: 'Швидка сума', pairs: 'Популярні пари', copy: 'Копіювати результат', copied: 'Результат скопійовано', copyFailed: 'Не вдалося скопіювати результат', goal: 'Мета за словами', progress: 'Виконано', focus: 'Режим зосередження', leave: 'Показати статистику', heroCurrency: 'ДОВІДКОВІ КУРСИ', heroText: 'АНАЛІЗ У БРАУЗЕРІ' }
  };
  const t = key => (words[UI.lang] || words.pl)[key];

  const langSelect = document.getElementById('language');
  const languageControl = document.createElement('label');
  languageControl.className = 'language-control';
  languageControl.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
  langSelect.parentNode.insertBefore(languageControl, langSelect);
  languageControl.append(langSelect);

  const main = document.querySelector('main');
  const grid = main.querySelector('.tool-grid');
  const hero = document.createElement('section');
  hero.className = 'studio-hero';
  const heroCopy = document.createElement('div');
  heroCopy.className = 'studio-hero-copy';
  const kicker = document.createElement('span');
  kicker.className = 'studio-kicker';
  const eyebrow = main.querySelector('.eyebrow');
  const title = main.querySelector('h1');
  const intro = main.querySelector('.intro');
  const clock = document.createElement('time');
  clock.className = 'studio-clock';
  clock.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span></span>';
  heroCopy.append(kicker, eyebrow, title, intro, clock);
  const visual = document.createElement('div');
  visual.className = 'studio-visual';
  visual.setAttribute('aria-hidden', 'true');
  visual.innerHTML = app === 'currency'
    ? '<div class="studio-visual-card"><div class="studio-visual-top"><span>NR. / CURRENCY</span><span class="studio-visual-icon">⇄</span></div><div class="studio-visual-main"><span>EUR</span><i>↔</i><span>PLN</span></div><div class="studio-visual-line"></div></div>'
    : '<div class="studio-visual-card"><div class="studio-visual-top"><span>NR. / TEXT</span><span class="studio-visual-icon">Aa</span></div><div class="studio-visual-main"><span>WORDS</span><i>·</i><span>IDEAS</span></div><div class="studio-visual-line"></div></div>';
  hero.append(heroCopy, visual);
  main.insertBefore(hero, grid);

  function updateClock() {
    const now = new Date();
    clock.dateTime = now.toISOString();
    const date = new Intl.DateTimeFormat(UI.locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(now);
    const time = new Intl.DateTimeFormat(UI.locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    clock.querySelector('span').textContent = `${t('local')} · ${date} · ${time}`;
  }

  let updateExtras = () => {};
  if (app === 'currency') {
    const amount = document.getElementById('amount');
    const amountField = amount.closest('.field');
    const quick = document.createElement('div');
    quick.className = 'quick-controls';
    quick.innerHTML = '<span class="quick-label"></span>' + [100, 500, 1000].map(value => `<button class="quick-chip" type="button" data-amount="${value}">${new Intl.NumberFormat('en-US').format(value)}</button>`).join('');
    amountField.after(quick);
    quick.addEventListener('click', event => {
      const button = event.target.closest('[data-amount]');
      if (!button) return;
      amount.value = button.dataset.amount;
      amount.dispatchEvent(new Event('input', { bubbles: true }));
      amount.focus();
    });

    const pair = document.querySelector('.pair');
    const shortcuts = document.createElement('div');
    shortcuts.className = 'pair-shortcuts';
    shortcuts.innerHTML = '<span class="quick-label"></span>' + [['EUR', 'PLN'], ['USD', 'PLN'], ['EUR', 'UAH']].map(([base, quote]) => `<button class="quick-chip" type="button" data-base="${base}" data-quote="${quote}">${base} / ${quote}</button>`).join('');
    pair.after(shortcuts);
    shortcuts.addEventListener('click', event => {
      const button = event.target.closest('[data-base]');
      if (!button) return;
      document.getElementById('from').value = button.dataset.base;
      const quote = document.getElementById('to');
      quote.value = button.dataset.quote;
      quote.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const result = document.getElementById('result');
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'button result-copy';
    copy.disabled = true;
    result.closest('.result').append(copy);
    const refreshCopy = () => { copy.disabled = !result.textContent.trim() || result.textContent.trim() === '—'; };
    new MutationObserver(refreshCopy).observe(result, { childList: true, characterData: true, subtree: true });
    refreshCopy();
    copy.addEventListener('click', async () => {
      const value = result.textContent.trim();
      if (!value || value === '—') return;
      try {
        await navigator.clipboard.writeText(value);
        document.getElementById('status').textContent = t('copied');
      } catch {
        const helper = document.createElement('textarea');
        helper.value = value;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.append(helper);
        helper.select();
        const ok = document.execCommand('copy');
        helper.remove();
        document.getElementById('status').textContent = t(ok ? 'copied' : 'copyFailed');
      }
    });
    updateExtras = () => {
      quick.querySelector('.quick-label').textContent = t('quick');
      shortcuts.querySelector('.quick-label').textContent = t('pairs');
      copy.textContent = t('copy');
      copy.setAttribute('aria-label', t('copy'));
    };
  } else {
    const input = document.getElementById('text');
    const actions = document.querySelector('.actions');
    const goal = document.createElement('div');
    goal.className = 'studio-goal';
    goal.innerHTML = '<div class="studio-goal-row"><label for="word-goal"></label><select id="word-goal"><option value="250">250</option><option value="500">500</option><option value="1000">1000</option></select><span class="goal-value"></span></div><progress id="goal-progress" max="100" value="0"></progress><div class="studio-goal-summary"></div>';
    document.getElementById('summary').after(goal);
    const target = goal.querySelector('select');
    const savedGoal = UI.storage.get('nr-text-word-goal', 500);
    target.value = [250, 500, 1000].includes(savedGoal) ? String(savedGoal) : '500';
    let goalTimer;
    function renderGoal() {
      const wordsCount = window.PortfolioTools.analyze(input.value, UI.lang).words;
      const targetCount = Number(target.value);
      const percent = Math.min(100, Math.round(wordsCount / targetCount * 100));
      goal.querySelector('progress').value = percent;
      goal.querySelector('.goal-value').textContent = percent + '%';
      goal.querySelector('.studio-goal-summary').textContent = `${new Intl.NumberFormat(UI.locale).format(wordsCount)} / ${new Intl.NumberFormat(UI.locale).format(targetCount)} · ${t('progress')}`;
    }
    input.addEventListener('input', () => { clearTimeout(goalTimer); goalTimer = setTimeout(renderGoal, 140); });
    target.addEventListener('change', () => { UI.storage.set('nr-text-word-goal', Number(target.value)); renderGoal(); });
    const focus = document.createElement('button');
    focus.type = 'button';
    focus.className = 'button';
    focus.id = 'focus-mode';
    focus.setAttribute('aria-pressed', 'false');
    actions.append(focus);
    focus.addEventListener('click', () => {
      const active = document.body.classList.toggle('focus-mode');
      focus.setAttribute('aria-pressed', String(active));
      focus.textContent = t(active ? 'leave' : 'focus');
      input.focus();
    });
    updateExtras = () => {
      goal.querySelector('label').textContent = t('goal');
      goal.querySelector('progress').setAttribute('aria-label', t('goal'));
      focus.textContent = t(document.body.classList.contains('focus-mode') ? 'leave' : 'focus');
      renderGoal();
    };
    renderGoal();
  }

  function translateExtras() {
    kicker.textContent = t(app === 'currency' ? 'heroCurrency' : 'heroText');
    updateClock();
    updateExtras();
  }
  window.addEventListener('tool-languagechange', translateExtras);
  translateExtras();
  setInterval(updateClock, 1000);
})();
