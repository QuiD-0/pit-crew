function createRefreshHandler(btn) {
  let isRefreshing = false;
  const icon = btn.querySelector('.header__btn-icon');

  function waitForAnimationCycle() {
    return new Promise(resolve => {
      icon.addEventListener('animationiteration', resolve, { once: true });
    });
  }

  return async function handleRefresh() {
    if (isRefreshing) return;
    isRefreshing = true;
    btn.disabled = true;
    void btn.offsetWidth;
    btn.classList.add('header__btn--spinning');
    try {
      const allKeys = await new Promise(resolve => chrome.storage.local.get(null, resolve));
      const resultKeys = Object.keys(allKeys).filter(k => k.startsWith('results_r'));
      await cacheInvalidate(['schedule', 'standings_drivers', 'standings_constructors', 'season_winners', ...resultKeys]);
      await Promise.all([renderCalendar(), renderStandings(), renderResults()]);
    } catch (err) {
      showToast('연결 실패');
    } finally {
      await waitForAnimationCycle();
      btn.classList.remove('header__btn--spinning');
      btn.disabled = false;
      isRefreshing = false;
    }
  };
}
