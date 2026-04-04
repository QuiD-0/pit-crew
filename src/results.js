const renderResults = (() => {
  let currentRound = null;

  async function render() {
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

      const roundOptions = pastRaces.map(r =>
        `<option value="${escapeHtml(r.round)}" ${r.round === currentRound ? 'selected' : ''}>R${escapeHtml(r.round)} · ${escapeHtml(r.raceName)}</option>`
      ).join('');

      const top10 = race.Results.slice(0, 10);
      const rest = race.Results.slice(10);

      panel.innerHTML = `
        <div class="results-header">
          <select class="results-header__select" id="round-select">${roundOptions}</select>
          <span class="results-header__info">${escapeHtml(race.Circuit.circuitName)}</span>
        </div>

        <div class="results-podium">
          ${top10.slice(0, 3).map((r, i) => `
            <div class="podium podium--p${i + 1}">
              <span class="podium__pos">${escapeHtml(r.position)}</span>
              <span class="podium__color" style="background: ${getConstructorColor(r.Constructor?.constructorId)}"></span>
              <div class="podium__driver">
                <span class="podium__name">${escapeHtml(r.Driver.code)}</span>
                <span class="podium__time">${escapeHtml(r.Time?.time || r.status)}</span>
              </div>
              <span class="podium__points">${r.points > 0 ? `+${escapeHtml(r.points)}` : ''}</span>
            </div>
          `).join('')}
        </div>

        <div class="results-list">
          ${top10.slice(3).map(r => `
            <div class="result-row">
              <span class="result-row__pos">${escapeHtml(r.position)}</span>
              <span class="result-row__color" style="background: ${getConstructorColor(r.Constructor?.constructorId)}"></span>
              <span class="result-row__name">${escapeHtml(r.Driver.code)}</span>
              <span class="result-row__time">${escapeHtml(r.Time?.time || r.status)}</span>
              <span class="result-row__points">${r.points > 0 ? `+${escapeHtml(r.points)}` : ''}</span>
            </div>
          `).join('')}
        </div>

        ${rest.length ? `
          <details class="results-rest">
            <summary class="results-rest__toggle">Show remaining drivers</summary>
            <div class="results-list">
              ${rest.map(r => `
                <div class="result-row">
                  <span class="result-row__pos">${escapeHtml(r.position)}</span>
                  <span class="result-row__color" style="background: ${getConstructorColor(r.Constructor?.constructorId)}"></span>
                  <span class="result-row__name">${escapeHtml(r.Driver.code)}</span>
                  <span class="result-row__time">${r.status === 'Finished' ? escapeHtml(r.Time?.time || '') : escapeHtml(r.status)}</span>
                  <span class="result-row__points">${r.points > 0 ? `+${escapeHtml(r.points)}` : ''}</span>
                </div>
              `).join('')}
            </div>
          </details>
        ` : ''}

        ${race.Results[0]?.FastestLap ? `
          <div class="fastest-lap">
            <span>Fastest Lap: ${escapeHtml(race.Results.find(r => r.FastestLap?.rank === '1')?.Driver.code || '—')}</span>
            <span>${escapeHtml(race.Results.find(r => r.FastestLap?.rank === '1')?.FastestLap?.Time?.time || '')}</span>
          </div>
        ` : ''}

        ${result.isStale ? `<div class="stale-notice">마지막 업데이트: ${timeAgo(result.timestamp)}</div>` : ''}
      `;

      document.getElementById('round-select').addEventListener('change', (e) => {
        currentRound = e.target.value;
        render();
      });
    } catch (err) {
      panel.innerHTML = `<div class="error">Failed to load results: ${escapeHtml(err.message)}</div>`;
    }
  }

  render.resetRound = () => { currentRound = null; };
  return render;
})();
