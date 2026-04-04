document.addEventListener('DOMContentLoaded', async () => {
  // Tab switching
  const tabBtns = document.querySelectorAll('.tabs__btn');
  const panels = document.querySelectorAll('.tab-panel');

  const content = document.querySelector('.content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('tabs__btn--active'));
      panels.forEach(p => p.classList.remove('tab-panel--active'));
      btn.classList.add('tabs__btn--active');
      const panel = document.getElementById(`panel-${btn.dataset.tab}`);
      panel.classList.add('tab-panel--active');

      if (btn.dataset.tab === 'calendar') {
        const nextCard = panel.querySelector('.race-card--next');
        if (nextCard) nextCard.scrollIntoView({ block: 'start' });
        else content.scrollTop = 0;
      } else {
        content.scrollTop = 0;
      }
    });
  });

  // Settings modal
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const backdrop = settingsModal.querySelector('.settings-modal__backdrop');

  settingsBtn.addEventListener('click', () => settingsModal.hidden = false);
  backdrop.addEventListener('click', () => settingsModal.hidden = true);

  // Refresh button — 캐시 지우고 다시 로드
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.addEventListener('click', createRefreshHandler(refreshBtn));

  // Initialize
  initThemes();
  await renderCalendar();
  await Promise.all([renderStandings(), renderResults()]);
});
