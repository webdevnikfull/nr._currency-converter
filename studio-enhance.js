(() => {
  'use strict';
  const UI = window.ToolUI;
  const app = document.body.dataset.app;
  const translations = {
    pl: {live:'NA ŻYWO', rate:'KURS WALUTOWY', words:'SŁOWA', chars:'ZNAKI', reading:'CZAS CZYTANIA', report:'Pobierz raport', reportTitle:'Raport przeliczenia walut', generated:'Wygenerowano', conversion:'Bieżące przeliczenie', history:'Historia obliczeń', amount:'Kwota', result:'Wynik', rateDate:'Data kursu', offline:'Zapisany kurs offline — może być nieaktualny', source:'Źródło kursów: Frankfurter', disclaimer:'Wynik nie uwzględnia prowizji ani spreadu.', noHistory:'Brak zapisanej historii.'},
    en: {live:'LIVE PREVIEW', rate:'EXCHANGE RATE', words:'WORDS', chars:'CHARACTERS', reading:'READING TIME', report:'Download report', reportTitle:'Currency conversion report', generated:'Generated', conversion:'Current conversion', history:'Calculation history', amount:'Amount', result:'Result', rateDate:'Rate date', offline:'Cached offline rate — may be outdated', source:'Rate source: Frankfurter', disclaimer:'Results exclude fees and spreads.', noHistory:'No saved history.'},
    de: {live:'LIVE-VORSCHAU', rate:'WECHSELKURS', words:'WÖRTER', chars:'ZEICHEN', reading:'LESEZEIT', report:'Bericht herunterladen', reportTitle:'Währungsbericht', generated:'Erstellt', conversion:'Aktuelle Umrechnung', history:'Berechnungsverlauf', amount:'Betrag', result:'Ergebnis', rateDate:'Kursdatum', offline:'Gespeicherter Offline-Kurs — möglicherweise veraltet', source:'Kursquelle: Frankfurter', disclaimer:'Ergebnisse ohne Gebühren und Spreads.', noHistory:'Kein gespeicherter Verlauf.'},
    uk: {live:'ЖИВИЙ ПЕРЕГЛЯД', rate:'ВАЛЮТНИЙ КУРС', words:'СЛОВА', chars:'СИМВОЛИ', reading:'ЧАС ЧИТАННЯ', report:'Завантажити звіт', reportTitle:'Звіт про конвертацію валют', generated:'Створено', conversion:'Поточна конвертація', history:'Історія обчислень', amount:'Сума', result:'Результат', rateDate:'Дата курсу', offline:'Збережений офлайн-курс — може бути застарілим', source:'Джерело курсів: Frankfurter', disclaimer:'Результат не враховує комісії та спред.', noHistory:'Збереженої історії немає.'}
  };
  const t = key => (translations[UI.lang] || translations.pl)[key];

  // Match the portfolio's compact globe-and-chevron language control.
  const select = document.getElementById('language');
  const oldControl = select.closest('.language-control');
  const menu = document.createElement('details');
  menu.className = 'studio-language-switch';
  menu.innerHTML = '<summary aria-label="Language"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg><span class="language-code">PL</span><svg class="language-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></summary><nav class="studio-language-options" aria-label="Language"><button type="button" data-lang="pl">Polski<span>PL</span></button><button type="button" data-lang="en">English<span>EN</span></button><button type="button" data-lang="de">Deutsch<span>DE</span></button><button type="button" data-lang="uk">Українська<span>UK</span></button></nav>';
  oldControl.replaceWith(menu);
  menu.append(select);
  select.hidden = true;
  menu.querySelector('.studio-language-options').addEventListener('click', event => {
    const button = event.target.closest('[data-lang]');
    if (!button) return;
    select.value = button.dataset.lang;
    select.dispatchEvent(new Event('change', {bubbles:true}));
    menu.open = false;
    menu.querySelector('summary').focus();
  });
  document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
  menu.addEventListener('keydown', event => { if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); } });

  // This is a live decorative preview, based on the actual app values.
  const visual = document.querySelector('.studio-visual');
  visual.classList.add('studio-visual-premium');
  visual.innerHTML = '<div class="visual-orbit orbit-one"></div><div class="visual-orbit orbit-two"></div><div class="visual-spark spark-one"></div><div class="visual-spark spark-two"></div><div class="studio-visual-card"><div class="studio-visual-top"><span class="visual-brand"></span><span class="studio-visual-icon"></span></div><div class="visual-eyebrow"></div><div class="studio-visual-main"><span class="visual-left"></span><i class="visual-direction"></i><span class="visual-right"></span></div><div class="visual-metric"></div><div class="studio-visual-line"></div></div>';
  const card = visual.querySelector('.studio-visual-card');
  const left = visual.querySelector('.visual-left');
  const right = visual.querySelector('.visual-right');
  const metric = visual.querySelector('.visual-metric');
  const output = app === 'currency' ? document.getElementById('result') : document.getElementById('stat-words');

  function animateCard() {
    card.classList.remove('visual-updated');
    void card.offsetWidth;
    card.classList.add('visual-updated');
  }
  function renderVisual() {
    visual.querySelector('.visual-brand').textContent = app === 'currency' ? 'NR. / CURRENCY' : 'NR. / TEXT';
    visual.querySelector('.studio-visual-icon').textContent = app === 'currency' ? '⇄' : 'Aa';
    visual.querySelector('.visual-eyebrow').textContent = t('live');
    if (app === 'currency') {
      left.textContent = document.getElementById('from').value;
      right.textContent = document.getElementById('to').value;
      visual.querySelector('.visual-direction').textContent = '↔';
      const result = output.textContent.trim();
      metric.textContent = result && result !== '—' ? `${t('rate')} · ${result}` : `${t('rate')} · —`;
    } else {
      left.textContent = output.textContent.trim() || '0';
      right.textContent = document.getElementById('stat-characters').textContent.trim() || '0';
      visual.querySelector('.visual-direction').textContent = '·';
      metric.textContent = `${t('words')} / ${t('chars')} · ${t('reading')}: ${document.getElementById('stat-reading').textContent.trim() || '0'}`;
    }
    animateCard();
  }
  const visualObserver = new MutationObserver(renderVisual);
  visualObserver.observe(output, {childList:true, characterData:true, subtree:true});
  if (app === 'currency') {
    document.getElementById('from').addEventListener('change', renderVisual);
    document.getElementById('to').addEventListener('change', renderVisual);
  } else {
    for (const id of ['stat-characters', 'stat-reading']) {
      visualObserver.observe(document.getElementById(id), {childList:true, characterData:true, subtree:true});
    }
  }

  if (app === 'currency') {
    const reportButton = document.createElement('button');
    reportButton.type = 'button';
    reportButton.className = 'button studio-report-button';
    reportButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3"/></svg><span></span>';
    document.querySelector('#converter .actions').append(reportButton);
    const refreshReport = () => { reportButton.disabled = !output.textContent.trim() || output.textContent.trim() === '—'; };
    new MutationObserver(refreshReport).observe(output, {childList:true, characterData:true, subtree:true});
    refreshReport();
    reportButton.addEventListener('click', () => {
      if (reportButton.disabled) return;
      const snapshot = window.CurrencyStudio.getSnapshot();
      if (!snapshot) return;
      const from = document.getElementById('from').value;
      const to = document.getElementById('to').value;
      const amount = window.PortfolioTools.parseAmount(document.getElementById('amount').value);
      if (amount === null) return;
      const formattedAmount = new Intl.NumberFormat(UI.locale, {maximumFractionDigits:8}).format(amount);
      const saved = UI.storage.get('nr-currency-history', []);
      const history = Array.isArray(saved) ? saved.filter(item => item && Number.isFinite(item.amount) && Number.isFinite(item.result)).slice(0,10) : [];
      const lines = [t('reportTitle'), '='.repeat(36), `${t('generated')}: ${new Intl.DateTimeFormat(UI.locale, {dateStyle:'long',timeStyle:'short'}).format(new Date())}`, '', t('conversion'), `${t('amount')}: ${formattedAmount} ${from}`, `${t('result')}: ${output.textContent.trim()}`, document.getElementById('rate').textContent.trim()];
      if (snapshot.cached) lines.push(window.CurrencyStudio.t('cached'));
      lines.push('', t('history'));
      if (history.length) {
        for (const item of history) lines.push(`${item.amount} ${item.from} → ${item.result} ${item.to} | ${window.CurrencyStudio.describe(item)}`);
      } else lines.push(t('noHistory'));
      lines.push('', `${window.CurrencyStudio.t('sourceLabel')}: ${window.CurrencyStudio.sourceName(snapshot)}`, t('disclaimer'));
      if (snapshot.source !== 'identity') lines.push(window.CurrencyRates.sources[snapshot.source].url);
      UI.download(`currency-report-${new Date().toISOString().slice(0,10)}.txt`, lines.join('\n') + '\n');
    });
    window.addEventListener('tool-languagechange', () => { reportButton.querySelector('span').textContent = t('report'); });
    reportButton.querySelector('span').textContent = t('report');
  }

  function translateEnhancements() {
    menu.querySelector('summary').setAttribute('aria-label', UI.t('language'));
    menu.querySelector('.studio-language-options').setAttribute('aria-label', UI.t('language'));
    menu.querySelector('.language-code').textContent = UI.lang.toUpperCase();
    menu.querySelectorAll('[data-lang]').forEach(button => {
      if (button.dataset.lang === UI.lang) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    renderVisual();
  }
  window.addEventListener('tool-languagechange', translateEnhancements);
  translateEnhancements();
})();
