const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc, storage } = require('./setup');

loadSrc('src/cache.js');

describe('cacheGet TTL 프리픽스 매칭', () => {
  beforeEach(() => resetStorage());

  it('results_r1은 results_r TTL(1시간)을 사용한다', async () => {
    storage.results_r1 = {
      data: { test: true },
      timestamp: Date.now() - (30 * 60 * 1000), // 30분 전
    };
    const result = await cacheGet('results_r1');
    assert.deepEqual(result, { test: true });
  });

  it('results_r99도 results_r TTL을 사용한다', async () => {
    storage.results_r99 = {
      data: { test: true },
      timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2시간 전 (1시간 TTL 초과)
    };
    const result = await cacheGet('results_r99');
    assert.equal(result, null);
  });

  it('standings_drivers는 정확 매칭으로 1시간 TTL이다', async () => {
    storage.standings_drivers = {
      data: [1],
      timestamp: Date.now() - (30 * 60 * 1000),
    };
    const result = await cacheGet('standings_drivers');
    assert.deepEqual(result, [1]);
  });

  it('standings_drivers는 1시간 초과 시 null', async () => {
    storage.standings_drivers = {
      data: [1],
      timestamp: Date.now() - (2 * 60 * 60 * 1000),
    };
    const result = await cacheGet('standings_drivers');
    assert.equal(result, null);
  });

  it('schedule은 24시간 이내면 캐시 반환', async () => {
    storage.schedule = {
      data: [1, 2],
      timestamp: Date.now() - (12 * 60 * 60 * 1000), // 12시간 전
    };
    const result = await cacheGet('schedule');
    assert.deepEqual(result, [1, 2]);
  });

  it('schedule은 24시간 초과 시 null', async () => {
    storage.schedule = {
      data: [1, 2],
      timestamp: Date.now() - (25 * 60 * 60 * 1000),
    };
    const result = await cacheGet('schedule');
    assert.equal(result, null);
  });
});

describe('season_winners TTL', () => {
  beforeEach(() => resetStorage());

  it('CACHE_TTL에 season_winners가 24시간으로 정의되어 있다', () => {
    assert.equal(CACHE_TTL.season_winners, 24 * 60 * 60 * 1000);
  });

  it('season_winners는 24시간 이내면 캐시 반환', async () => {
    storage.season_winners = {
      data: { '1': { code: 'VER', time: '1:30:00' } },
      timestamp: Date.now() - (12 * 60 * 60 * 1000),
    };
    const result = await cacheGet('season_winners');
    assert.deepEqual(result, { '1': { code: 'VER', time: '1:30:00' } });
  });

  it('season_winners는 24시간 초과 시 null', async () => {
    storage.season_winners = {
      data: { '1': { code: 'VER', time: '1:30:00' } },
      timestamp: Date.now() - (25 * 60 * 60 * 1000),
    };
    const result = await cacheGet('season_winners');
    assert.equal(result, null);
  });
});

describe('cacheSet 타임스탬프', () => {
  beforeEach(() => resetStorage());

  it('cacheSet은 현재 시간 기준 타임스탬프를 저장한다', async () => {
    const before = Date.now();
    await cacheSet('test_key', { hello: 'world' });
    const after = Date.now();
    assert.ok(storage.test_key.timestamp >= before);
    assert.ok(storage.test_key.timestamp <= after);
    assert.deepEqual(storage.test_key.data, { hello: 'world' });
  });

  it('같은 키에 두 번 저장하면 마지막 값이 남는다', async () => {
    await cacheSet('test_key', 'first');
    await cacheSet('test_key', 'second');
    assert.equal(storage.test_key.data, 'second');
  });
});
