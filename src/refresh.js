function createRefreshHandler(btn) {
  let isRefreshing = false;

  return async function handleRefresh() {
    if (isRefreshing) return;
    isRefreshing = true;
    btn.disabled = true;
    btn.classList.add('header__btn--spinning');
    try {
      await new Promise(resolve => {
        chrome.storage.local.remove(['schedule', 'standings_drivers', 'standings_constructors', 'results'], resolve);
      });
      await Promise.all([renderCalendar(), renderStandings(), renderResults()]);
    } finally {
      btn.classList.remove('header__btn--spinning');
      btn.disabled = false;
      isRefreshing = false;
    }
  };
}
