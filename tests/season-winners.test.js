const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc, storage } = require('./setup');

loadSrc('src/cache.js', 'src/api.js');

describe('getSeasonWinners', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
  });

  it('각 라운드의 우승자를 code와 time으로 매핑한다', async () => {
    const mockRaces = [
      {
        round: '1',
        Results: [{ Driver: { code: 'VER' }, Time: { time: '1:30:00.000' }, status: 'Finished' }],
      },
      {
        round: '2',
        Results: [{ Driver: { code: 'HAM' }, Time: { time: '1:45:00.000' }, status: 'Finished' }],
      },
    ];
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { RaceTable: { Races: mockRaces } },
        }),
      })
    );
    const result = await getSeasonWinners();
    assert.deepEqual(result.data, {
      '1': { code: 'VER', time: '1:30:00.000' },
      '2': { code: 'HAM', time: '1:45:00.000' },
    });
    assert.equal(result.isStale, false);
  });

  it('Time이 없으면 status를 사용한다', async () => {
    const mockRaces = [
      {
        round: '1',
        Results: [{ Driver: { code: 'VER' }, status: '+1 Lap' }],
      },
    ];
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { RaceTable: { Races: mockRaces } },
        }),
      })
    );
    const result = await getSeasonWinners();
    assert.deepEqual(result.data, {
      '1': { code: 'VER', time: '+1 Lap' },
    });
  });

  it('빈 레이스 목록이면 빈 객체를 반환한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { RaceTable: { Races: [] } },
        }),
      })
    );
    const result = await getSeasonWinners();
    assert.deepEqual(result.data, {});
  });

  it('두 번째 호출은 캐시에서 반환한다', async () => {
    let fetchCount = 0;
    mock.method(globalThis, 'fetch', () => {
      fetchCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          MRData: { RaceTable: { Races: [] } },
        }),
      });
    });
    await getSeasonWinners();
    await getSeasonWinners();
    assert.equal(fetchCount, 1);
  });

  it('API 실패 + stale 캐시 → 폴백', async () => {
    const ts = Date.now() - (48 * 60 * 60 * 1000);
    storage.season_winners = { data: { '1': { code: 'VER', time: '1:30:00' } }, timestamp: ts };
    mock.method(globalThis, 'fetch', () => Promise.reject(new Error('offline')));
    const result = await getSeasonWinners();
    assert.deepEqual(result.data, { '1': { code: 'VER', time: '1:30:00' } });
    assert.equal(result.isStale, true);
  });

  it('API 실패 + 캐시 없음 → 에러', async () => {
    mock.method(globalThis, 'fetch', () => Promise.reject(new Error('offline')));
    await assert.rejects(() => getSeasonWinners(), /offline/);
  });
});
