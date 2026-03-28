const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc, storage } = require('./setup');

loadSrc('src/cache.js', 'src/api.js');

describe('fetchF1 엣지 케이스', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('올바른 URL로 fetch를 호출한다', async () => {
    let calledUrl = null;
    mock.method(globalThis, 'fetch', (url) => {
      calledUrl = url;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: {} }),
      });
    });
    await fetchF1('/current.json?limit=30');
    assert.equal(calledUrl, 'https://api.jolpi.ca/ergast/f1/current.json?limit=30');
  });

  it('네트워크 에러 (fetch 자체 실패) 시 에러가 전파된다', async () => {
    mock.method(globalThis, 'fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    await assert.rejects(() => fetchF1('/current.json'), /Failed to fetch/);
  });

  it('404 응답도 에러를 던진다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({ ok: false, status: 404 })
    );
    await assert.rejects(() => fetchF1('/invalid'), /API error: 404/);
  });
});

describe('getSchedule fresh 캐시 히트', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('fresh 캐시가 있으면 fetch를 호출하지 않는다', async () => {
    const ts = Date.now() - (1 * 60 * 60 * 1000); // 1시간 전 (24시간 TTL 내)
    storage.schedule = { data: [{ round: '1' }], timestamp: ts };
    let fetchCalled = false;
    mock.method(globalThis, 'fetch', () => {
      fetchCalled = true;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ MRData: { RaceTable: { Races: [] } } }) });
    });
    const result = await getSchedule();
    assert.equal(fetchCalled, false);
    assert.deepEqual(result.data, [{ round: '1' }]);
  });
});

describe('getRaceResults 캐시 키', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('다른 라운드는 다른 캐시 키를 사용한다', async () => {
    const race5 = { raceName: 'Round 5', Results: [] };
    const race10 = { raceName: 'Round 10', Results: [] };

    mock.method(globalThis, 'fetch', (url) => {
      const round = url.includes('/5/') ? race5 : race10;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [round] } } }),
      });
    });

    const r5 = await getRaceResults('5');
    const r10 = await getRaceResults('10');
    assert.equal(r5.data.raceName, 'Round 5');
    assert.equal(r10.data.raceName, 'Round 10');
    assert.ok(storage.results_r5);
    assert.ok(storage.results_r10);
  });
});

describe('getConstructorStandings 빈 목록', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
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
    const result = await getConstructorStandings();
    assert.deepEqual(result.data, []);
  });
});
