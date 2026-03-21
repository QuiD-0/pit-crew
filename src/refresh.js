function createRefreshHandler(btn) {
  let isRefreshing = false;

  return async function handleRefresh() {
    if (isRefreshing) return;
    isRefreshing = true;
    btn.disabled = true;
    btn.classList.add('header__btn--spinning');
    try {
      await cacheInvalidate(['schedule', 'standings_drivers', 'standings_constructors', 'results']);
      await Promise.all([renderCalendar(), renderStandings(), renderResults()]);
    } catch (err) {
      showToast('연결 실패');
    } finally {
      btn.classList.remove('header__btn--spinning');
      btn.disabled = false;
      isRefreshing = false;
    }
  };
}
