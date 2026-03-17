const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc, storage } = require('./setup');

loadSrc('src/cache.js');

describe('cacheSet / cacheGet', () => {
  beforeEach(() => resetStorage());

  it('데이터를 저장하고 조회할 수 있다', async () => {
    await cacheSet('schedule', [{ race: 1 }]);
    const result = await cacheGet('schedule');
    assert.deepEqual(result, [{ race: 1 }]);
  });

  it('존재하지 않는 키는 null을 반환한다', async () => {
    const result = await cacheGet('nonexistent');
    assert.equal(result, null);
  });

  it('TTL이 만료되면 null을 반환한다', async () => {
    storage.results = {
      data: { test: true },
      timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2시간 전 (results TTL은 1시간)
    };
    const result = await cacheGet('results');
    assert.equal(result, null);
  });

  it('TTL 이내면 캐시된 데이터를 반환한다', async () => {
    storage.results = {
      data: { test: true },
      timestamp: Date.now() - (30 * 60 * 1000), // 30분 전 (results TTL은 1시간)
    };
    const result = await cacheGet('results');
    assert.deepEqual(result, { test: true });
  });

  it('알 수 없는 키는 schedule TTL(24시간)로 폴백한다', async () => {
    storage.unknown_key = {
      data: 'hello',
      timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2시간 전
    };
    const result = await cacheGet('unknown_key');
    assert.equal(result, 'hello');
  });
});

describe('CACHE_TTL', () => {
  it('schedule은 24시간이다', () => {
    assert.equal(CACHE_TTL.schedule, 24 * 60 * 60 * 1000);
  });

  it('standings_drivers는 1시간이다', () => {
    assert.equal(CACHE_TTL.standings_drivers, 60 * 60 * 1000);
  });

  it('standings_constructors는 1시간이다', () => {
    assert.equal(CACHE_TTL.standings_constructors, 60 * 60 * 1000);
  });

  it('results는 1시간이다', () => {
    assert.equal(CACHE_TTL.results, 60 * 60 * 1000);
  });
});
