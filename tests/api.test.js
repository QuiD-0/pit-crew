const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc } = require('./setup');

loadSrc('src/cache.js', 'src/api.js');

describe('fetchF1', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('성공 응답을 MRData로 파싱한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [] } } }),
      })
    );
    const result = await fetchF1('/current.json');
    assert.ok(result.RaceTable);
  });

  it('실패 응답에 에러를 던진다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({ ok: false, status: 500 })
    );
    await assert.rejects(() => fetchF1('/current.json'), /API error: 500/);
  });
});

describe('getSchedule', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('API에서 레이스 목록을 가져온다', async () => {
    const mockRaces = [{ round: '1', raceName: 'Australian GP' }];
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { RaceTable: { Races: mockRaces } },
        }),
      })
    );
    const result = await getSchedule();
    assert.deepEqual(result, mockRaces);
  });

  it('두 번째 호출에서 캐시된 데이터를 반환한다', async () => {
    const mockRaces = [{ round: '1' }];
    let fetchCount = 0;
    mock.method(globalThis, 'fetch', () => {
      fetchCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { RaceTable: { Races: mockRaces } },
        }),
      });
    });
    await getSchedule();
    await getSchedule();
    assert.equal(fetchCount, 1);
  });
});

describe('getDriverStandings', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('드라이버 순위를 가져온다', async () => {
    const mockStandings = [{ position: '1', Driver: { familyName: 'Russell' } }];
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { StandingsTable: { StandingsLists: [{ DriverStandings: mockStandings }] } },
        }),
      })
    );
    const result = await getDriverStandings();
    assert.deepEqual(result, mockStandings);
  });

  it('StandingsLists가 비어있으면 빈 배열을 반환한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { StandingsTable: { StandingsLists: [] } },
        }),
      })
    );
    const result = await getDriverStandings();
    assert.deepEqual(result, []);
  });
});

describe('getConstructorStandings', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('컨스트럭터 순위를 가져온다', async () => {
    const mockStandings = [{ position: '1', Constructor: { name: 'Mercedes' } }];
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { StandingsTable: { StandingsLists: [{ ConstructorStandings: mockStandings }] } },
        }),
      })
    );
    const result = await getConstructorStandings();
    assert.deepEqual(result, mockStandings);
  });
});

describe('getLastRaceResults', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('최근 레이스 결과를 가져온다', async () => {
    const mockRace = { raceName: 'Chinese GP', Results: [] };
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { RaceTable: { Races: [mockRace] } },
        }),
      })
    );
    const result = await getLastRaceResults();
    assert.deepEqual(result, mockRace);
  });

  it('결과가 없으면 null을 반환한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { RaceTable: { Races: [] } },
        }),
      })
    );
    const result = await getLastRaceResults();
    assert.equal(result, null);
  });
});
