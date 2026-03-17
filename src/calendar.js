function formatLocalDate(dateStr, timeStr) {
  const dt = new Date(`${dateStr}T${timeStr}`);
  return {
    date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }),
  };
}

function getSessionList(race) {
  const sessions = [];
  if (race.FirstPractice) sessions.push({ name: 'FP1', ...race.FirstPractice });
  if (race.SecondPractice) sessions.push({ name: 'FP2', ...race.SecondPractice });
  if (race.ThirdPractice) sessions.push({ name: 'FP3', ...race.ThirdPractice });
  if (race.SprintQualifying) sessions.push({ name: 'Sprint Quali', ...race.SprintQualifying });
  if (race.Sprint) sessions.push({ name: 'Sprint', ...race.Sprint });
  if (race.Qualifying) sessions.push({ name: 'Qualifying', ...race.Qualifying });
  sessions.push({ name: 'Race', date: race.date, time: race.time || '00:00:00Z' });
  return sessions;
}

function isNextRace(race) {
  const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
  return raceDate > new Date();
}

function getCountdown(race) {
  const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
  const diff = raceDate - new Date();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

async function renderCalendar() {
  const panel = document.getElementById('panel-calendar');
  panel.innerHTML = '<div class="loading">Loading calendar</div>';

  try {
    const races = await getSchedule();
    const nextIdx = races.findIndex(isNextRace);

    panel.innerHTML = races.map((race, i) => {
      const isNext = i === nextIdx;
      const isPast = i < nextIdx || (nextIdx === -1);
      const countdown = isNext ? getCountdown(race) : null;
      const sessions = getSessionList(race);
      const location = race.Circuit.Location;

      return `
        <details class="race-card ${isNext ? 'race-card--next' : ''} ${isPast ? 'race-card--past' : ''}" ${isNext ? 'open' : ''}>
          <summary class="race-card__header">
            <span class="race-card__round">R${race.round}</span>
            <div class="race-card__info">
              <span class="race-card__name">${race.raceName}</span>
              <span class="race-card__location">${location.locality}, ${location.country}</span>
            </div>
            <div class="race-card__meta">
              ${countdown ? `<span class="race-card__countdown">${countdown}</span>` : ''}
              <span class="race-card__date">${formatLocalDate(race.date, race.time).date}</span>
            </div>
          </summary>
          <div class="race-card__sessions">
            ${sessions.map(s => {
              const ft = formatLocalDate(s.date, s.time);
              return `
                <div class="session">
                  <span class="session__name">${s.name}</span>
                  <span class="session__time">${ft.weekday} ${ft.date} · ${ft.time}</span>
                </div>`;
            }).join('')}
          </div>
        </details>
      `;
    }).join('');

    // Scroll to next race
    if (nextIdx > -1) {
      const nextCard = panel.querySelector('.race-card--next');
      if (nextCard) nextCard.scrollIntoView({ block: 'start' });
    }
  } catch (err) {
    panel.innerHTML = `<div class="error">Failed to load calendar: ${err.message}</div>`;
  }
}
