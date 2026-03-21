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

describe('cacheGet stale mode', () => {
  beforeEach(() => resetStorage());

  it('stale:true — TTL 만료된 데이터를 { data, timestamp, isStale: true }로 반환한다', async () => {
    const ts = Date.now() - (2 * 60 * 60 * 1000);
    storage.results = { data: { test: true }, timestamp: ts };
    const result = await cacheGet('results', { stale: true });
    assert.deepEqual(result, { data: { test: true }, timestamp: ts, isStale: true });
  });

  it('stale:true — TTL 이내면 { data, timestamp, isStale: false }로 반환한다', async () => {
    const ts = Date.now() - (30 * 60 * 1000);
    storage.results = { data: { test: true }, timestamp: ts };
    const result = await cacheGet('results', { stale: true });
    assert.deepEqual(result, { data: { test: true }, timestamp: ts, isStale: false });
  });

  it('stale:true — 데이터가 없으면 null을 반환한다', async () => {
    const result = await cacheGet('nonexistent', { stale: true });
    assert.equal(result, null);
  });

  it('stale:false(기본값)는 기존과 동일하게 동작한다', async () => {
    storage.results = {
      data: { test: true },
      timestamp: Date.now() - (2 * 60 * 60 * 1000),
    };
    const result = await cacheGet('results');
    assert.equal(result, null);
  });
});

describe('cacheInvalidate', () => {
  beforeEach(() => resetStorage());

  it('키의 timestamp를 0으로 리셋한다', async () => {
    storage.schedule = { data: [1, 2], timestamp: Date.now() };
    await cacheInvalidate(['schedule']);
    assert.equal(storage.schedule.timestamp, 0);
    assert.deepEqual(storage.schedule.data, [1, 2]);
  });

  it('여러 키를 한번에 무효화한다', async () => {
    storage.schedule = { data: [], timestamp: Date.now() };
    storage.results = { data: {}, timestamp: Date.now() };
    await cacheInvalidate(['schedule', 'results']);
    assert.equal(storage.schedule.timestamp, 0);
    assert.equal(storage.results.timestamp, 0);
  });

  it('존재하지 않는 키는 무시한다', async () => {
    await cacheInvalidate(['nonexistent']);
    assert.equal(storage.nonexistent, undefined);
  });
});

describe('cacheGet stale — 엣지 케이스', () => {
  beforeEach(() => resetStorage());

  it('timestamp=0 (무효화된 캐시) + stale:true → isStale: true', async () => {
    storage.schedule = { data: [1, 2], timestamp: 0 };
    const result = await cacheGet('schedule', { stale: true });
    assert.equal(result.isStale, true);
    assert.deepEqual(result.data, [1, 2]);
  });

  it('timestamp=0 (무효화된 캐시) + stale:false → null', async () => {
    storage.schedule = { data: [1, 2], timestamp: 0 };
    const result = await cacheGet('schedule');
    assert.equal(result, null);
  });

  it('stale:true로 null 데이터가 저장된 캐시 → { data: null, isStale }', async () => {
    storage.results = { data: null, timestamp: Date.now() };
    const result = await cacheGet('results', { stale: true });
    assert.equal(result.data, null);
    assert.equal(result.isStale, false);
  });
});

describe('cacheInvalidate — 엣지 케이스', () => {
  beforeEach(() => resetStorage());

  it('빈 배열을 전달하면 아무것도 하지 않는다', async () => {
    storage.schedule = { data: [1], timestamp: Date.now() };
    await cacheInvalidate([]);
    assert.ok(storage.schedule.timestamp > 0);
  });

  it('존재하는 키와 없는 키가 섞여있으면 존재하는 것만 무효화한다', async () => {
    storage.schedule = { data: [1], timestamp: Date.now() };
    await cacheInvalidate(['schedule', 'nonexistent']);
    assert.equal(storage.schedule.timestamp, 0);
    assert.equal(storage.nonexistent, undefined);
  });

  it('무효화 후 cacheGet stale:true로 데이터를 복원할 수 있다', async () => {
    storage.schedule = { data: [1, 2, 3], timestamp: Date.now() };
    await cacheInvalidate(['schedule']);
    const result = await cacheGet('schedule', { stale: true });
    assert.deepEqual(result.data, [1, 2, 3]);
    assert.equal(result.isStale, true);
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
