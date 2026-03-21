const API_BASE = 'https://api.jolpi.ca/ergast/f1';

async function fetchF1(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.MRData;
}

async function getSchedule() {
  const cached = await cacheGet('schedule', { stale: true });
  if (cached && !cached.isStale) return cached;

  try {
    const data = await fetchF1('/current.json?limit=30');
    const races = data.RaceTable.Races;
    await cacheSet('schedule', races);
    return { data: races, timestamp: Date.now(), isStale: false };
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function getDriverStandings() {
  const cached = await cacheGet('standings_drivers', { stale: true });
  if (cached && !cached.isStale) return cached;

  try {
    const data = await fetchF1('/current/driverStandings.json');
    const standings = data.StandingsTable.StandingsLists[0]?.DriverStandings || [];
    await cacheSet('standings_drivers', standings);
    return { data: standings, timestamp: Date.now(), isStale: false };
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function getConstructorStandings() {
  const cached = await cacheGet('standings_constructors', { stale: true });
  if (cached && !cached.isStale) return cached;

  try {
    const data = await fetchF1('/current/constructorStandings.json');
    const standings = data.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
    await cacheSet('standings_constructors', standings);
    return { data: standings, timestamp: Date.now(), isStale: false };
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function getLastRaceResults() {
  const cached = await cacheGet('results', { stale: true });
  if (cached && !cached.isStale) return cached;

  try {
    const data = await fetchF1('/current/last/results.json');
    const race = data.RaceTable.Races[0] || null;
    await cacheSet('results', race);
    return { data: race, timestamp: Date.now(), isStale: false };
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}
