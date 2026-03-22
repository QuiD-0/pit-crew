document.addEventListener('DOMContentLoaded', async () => {
  // Tab switching
  const tabBtns = document.querySelectorAll('.tabs__btn');
  const panels = document.querySelectorAll('.tab-panel');

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
        else panel.scrollTop = 0;
      } else {
        panel.scrollTop = 0;
      }
    });
  });

  // Theme modal
  const themeBtn = document.getElementById('theme-btn');
  const themeModal = document.getElementById('theme-modal');
  const backdrop = themeModal.querySelector('.theme-modal__backdrop');

  themeBtn.addEventListener('click', () => themeModal.hidden = false);
  backdrop.addEventListener('click', () => themeModal.hidden = true);

  // Refresh button — 캐시 지우고 다시 로드
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.addEventListener('click', createRefreshHandler(refreshBtn));

  // Initialize
  initThemes();
  renderCalendar();
  renderStandings();
  renderResults();
});
