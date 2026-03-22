let currentRound = null;

async function renderResults() {
  const panel = document.getElementById('panel-results');
  panel.innerHTML = '<div class="loading">Loading results</div>';

  try {
    const scheduleResult = await getSchedule();
    const races = scheduleResult.data;
    const now = new Date();
    const pastRaces = races.filter(r => {
      const raceDate = new Date(`${r.date}T${r.time || '00:00:00Z'}`);
      return raceDate <= now;
    });

    if (!pastRaces.length) {
      panel.innerHTML = '<div class="error">No results available yet</div>';
      return;
    }

    if (!currentRound) currentRound = pastRaces[pastRaces.length - 1].round;

    const result = await getRaceResults(currentRound);
    const race = result.data;
    if (!race) {
      panel.innerHTML = '<div class="error">No results available yet</div>';
      return;
    }

    const roundSelect = pastRaces.map(r =>
      `<option value="${r.round}" ${r.round === currentRound ? 'selected' : ''}>R${r.round} ${r.raceName}</option>`
    ).join('');

    const top10 = race.Results.slice(0, 10);
    const rest = race.Results.slice(10);

    panel.innerHTML = `
      <div class="results-header">
        <div class="results-header__top">
          <h2 class="results-header__name">${race.raceName}</h2>
          <select class="results-header__select" id="round-select">${roundSelect}</select>
        </div>
        <span class="results-header__info">${race.Circuit.circuitName} · Round ${race.round}</span>
      </div>

      <div class="results-podium">
        ${top10.slice(0, 3).map((r, i) => `
          <div class="podium podium--p${i + 1}">
            <span class="podium__pos">${r.position}</span>
            <span class="podium__color" style="background: ${getConstructorColor(r.Constructor?.constructorId)}"></span>
            <div class="podium__driver">
              <span class="podium__name">${r.Driver.code}</span>
              <span class="podium__time">${r.Time?.time || r.status}</span>
            </div>
            <span class="podium__points">${r.points > 0 ? `+${r.points}` : ''}</span>
          </div>
        `).join('')}
      </div>

      <div class="results-list">
        ${top10.slice(3).map(r => `
          <div class="result-row">
            <span class="result-row__pos">${r.position}</span>
            <span class="result-row__color" style="background: ${getConstructorColor(r.Constructor?.constructorId)}"></span>
            <span class="result-row__name">${r.Driver.code}</span>
            <span class="result-row__time">${r.Time?.time || r.status}</span>
            <span class="result-row__points">${r.points > 0 ? `+${r.points}` : ''}</span>
          </div>
        `).join('')}
      </div>

      ${rest.length ? `
        <details class="results-rest">
          <summary class="results-rest__toggle">Show remaining drivers</summary>
          <div class="results-list">
            ${rest.map(r => `
              <div class="result-row">
                <span class="result-row__pos">${r.position}</span>
                <span class="result-row__color" style="background: ${getConstructorColor(r.Constructor?.constructorId)}"></span>
                <span class="result-row__name">${r.Driver.code}</span>
                <span class="result-row__time">${r.status === 'Finished' ? (r.Time?.time || '') : r.status}</span>
                <span class="result-row__points">${r.points > 0 ? `+${r.points}` : ''}</span>
              </div>
            `).join('')}
          </div>
        </details>
      ` : ''}

      ${race.Results[0]?.FastestLap ? `
        <div class="fastest-lap">
          <span>Fastest Lap: ${race.Results.find(r => r.FastestLap?.rank === '1')?.Driver.code || '—'}</span>
          <span>${race.Results.find(r => r.FastestLap?.rank === '1')?.FastestLap.Time.time || ''}</span>
        </div>
      ` : ''}

      ${result.isStale ? `<div class="stale-notice">마지막 업데이트: ${timeAgo(result.timestamp)}</div>` : ''}
    `;

    document.getElementById('round-select').addEventListener('change', (e) => {
      currentRound = e.target.value;
      renderResults();
    });
  } catch (err) {
    panel.innerHTML = `<div class="error">Failed to load results: ${err.message}</div>`;
  }
}
