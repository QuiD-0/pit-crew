const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc } = require('./setup');

loadSrc('src/teams.js', 'src/cache.js', 'src/toast.js', 'src/api.js', 'src/results.js');

// DOM mock — renderResults가 쓰는 panel을 시뮬레이션
let panelHtml = '';
const mockPanel = {
  get innerHTML() { return panelHtml; },
  set innerHTML(v) { panelHtml = v; },
};
const origGetById = globalThis.document.getElementById;
globalThis.document.getElementById = (id) => {
  if (id === 'panel-results') return mockPanel;
  return origGetById(id);
};

function mockRace(overrides = {}) {
  return {
    raceName: 'Australian Grand Prix',
    round: '1',
    Circuit: { circuitName: 'Albert Park Grand Prix Circuit' },
    Results: [
      { position: '1', points: '25', Driver: { code: 'RUS' }, Constructor: { constructorId: 'mercedes' }, Time: { time: '1:33:15.607' }, FastestLap: { rank: '1', Time: { time: '1:35.275' } }, status: 'Finished' },
      { position: '2', points: '18', Driver: { code: 'ANT' }, Constructor: { constructorId: 'mercedes' }, Time: { time: '+3.542' }, status: 'Finished' },
      { position: '3', points: '15', Driver: { code: 'LEC' }, Constructor: { constructorId: 'ferrari' }, Time: { time: '+12.345' }, status: 'Finished' },
      { position: '4', points: '12', Driver: { code: 'NOR' }, Constructor: { constructorId: 'mclaren' }, Time: { time: '+20.111' }, status: 'Finished' },
      { position: '5', points: '10', Driver: { code: 'PIA' }, Constructor: { constructorId: 'mclaren' }, Time: { time: '+25.222' }, status: 'Finished' },
      { position: '6', points: '8', Driver: { code: 'VER' }, Constructor: { constructorId: 'red_bull' }, Time: { time: '+30.333' }, status: 'Finished' },
      { position: '7', points: '6', Driver: { code: 'HAM' }, Constructor: { constructorId: 'ferrari' }, Time: { time: '+35.444' }, status: 'Finished' },
      { position: '8', points: '4', Driver: { code: 'ALO' }, Constructor: { constructorId: 'aston_martin' }, Time: { time: '+40.555' }, status: 'Finished' },
      { position: '9', points: '2', Driver: { code: 'GAS' }, Constructor: { constructorId: 'alpine' }, Time: { time: '+45.666' }, status: 'Finished' },
      { position: '10', points: '1', Driver: { code: 'OCO' }, Constructor: { constructorId: 'alpine' }, Time: { time: '+50.777' }, status: 'Finished' },
      { position: '11', points: '0', Driver: { code: 'STR' }, Constructor: { constructorId: 'aston_martin' }, Time: { time: '+55.888' }, status: 'Finished' },
      { position: '12', points: '0', Driver: { code: 'TSU' }, Constructor: { constructorId: 'rb' }, status: 'Retired' },
    ],
    ...overrides,
  };
}

describe('renderResults', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
    panelHtml = '';
  });

  it('레이스 결과가 없으면 안내 메시지를 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('No results available yet'));
  });

  it('레이스명과 서킷명을 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [mockRace()] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('Australian Grand Prix'));
    assert.ok(panelHtml.includes('Albert Park Grand Prix Circuit'));
    assert.ok(panelHtml.includes('Round 1'));
  });

  it('포디움 3명을 렌더링한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [mockRace()] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('podium--p1'));
    assert.ok(panelHtml.includes('podium--p2'));
    assert.ok(panelHtml.includes('podium--p3'));
    assert.ok(panelHtml.includes('RUS'));
    assert.ok(panelHtml.includes('ANT'));
    assert.ok(panelHtml.includes('LEC'));
  });

  it('P1 시간을 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [mockRace()] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('1:33:15.607'));
  });

  it('포인트가 있는 드라이버는 +포인트를 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [mockRace()] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('+25'));
    assert.ok(panelHtml.includes('+18'));
  });

  it('0포인트 드라이버는 빈 문자열을 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [mockRace()] } } }),
      })
    );
    await renderResults();
    // position 11 (0 points) — +0이 아닌 빈 값
    assert.ok(!panelHtml.includes('+0'));
  });

  it('리타이어 드라이버는 status를 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [mockRace()] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('Retired'));
  });

  it('11위 이하 드라이버는 접힌 섹션에 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [mockRace()] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('Show remaining drivers'));
    assert.ok(panelHtml.includes('STR'));
    assert.ok(panelHtml.includes('TSU'));
  });

  it('패스티스트 랩을 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [mockRace()] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('Fastest Lap'));
    assert.ok(panelHtml.includes('RUS'));
    assert.ok(panelHtml.includes('1:35.275'));
  });

  it('패스티스트 랩 데이터가 없으면 섹션을 표시하지 않는다', async () => {
    const race = mockRace();
    race.Results.forEach(r => delete r.FastestLap);
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [race] } } }),
      })
    );
    await renderResults();
    assert.ok(!panelHtml.includes('Fastest Lap'));
  });

  it('Constructor가 없어도 크래시하지 않는다', async () => {
    const race = mockRace();
    race.Results[0].Constructor = undefined;
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [race] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('RUS'));
  });

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({ ok: false, status: 500 })
    );
    await renderResults();
    assert.ok(panelHtml.includes('Failed to load results'));
  });

  it('결과가 10명 이하면 접힌 섹션을 표시하지 않는다', async () => {
    const race = mockRace();
    race.Results = race.Results.slice(0, 5);
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [race] } } }),
      })
    );
    await renderResults();
    assert.ok(!panelHtml.includes('Show remaining drivers'));
  });

  it('Time이 없는 P1은 status로 폴백한다', async () => {
    const race = mockRace();
    delete race.Results[0].Time;
    mock.method(globalThis, 'fetch', () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ MRData: { RaceTable: { Races: [race] } } }),
      })
    );
    await renderResults();
    assert.ok(panelHtml.includes('Finished'));
  });

  it('stale 데이터일 때 stale-notice를 표시한다', async () => {
    const ts = Date.now() - (3 * 60 * 60 * 1000);
    globalThis.getLastRaceResults = async () => ({
      data: mockRace(),
      timestamp: ts,
      isStale: true,
    });
    await renderResults();
    assert.ok(panelHtml.includes('stale-notice'));
    assert.ok(panelHtml.includes('3시간 전'));
  });

  it('fresh 데이터일 때 stale-notice를 표시하지 않는다', async () => {
    globalThis.getLastRaceResults = async () => ({
      data: mockRace(),
      timestamp: Date.now(),
      isStale: false,
    });
    await renderResults();
    assert.ok(!panelHtml.includes('stale-notice'));
  });

  it('결과 없음일 때 null data를 처리한다', async () => {
    globalThis.getLastRaceResults = async () => ({
      data: null,
      timestamp: Date.now(),
      isStale: false,
    });
    await renderResults();
    assert.ok(panelHtml.includes('No results available yet'));
  });

  it('stale + null data → "No results" 메시지 (stale notice 아님)', async () => {
    globalThis.getLastRaceResults = async () => ({
      data: null,
      timestamp: Date.now() - (2 * 60 * 60 * 1000),
      isStale: true,
    });
    await renderResults();
    assert.ok(panelHtml.includes('No results available yet'));
    assert.ok(!panelHtml.includes('stale-notice'));
  });

  it('결과가 3명 미만이어도 크래시하지 않는다', async () => {
    const race = mockRace();
    race.Results = race.Results.slice(0, 2);
    globalThis.getLastRaceResults = async () => ({
      data: race,
      timestamp: Date.now(),
      isStale: false,
    });
    await renderResults();
    assert.ok(panelHtml.includes('podium--p1'));
    assert.ok(panelHtml.includes('podium--p2'));
    assert.ok(!panelHtml.includes('podium--p3'));
  });

  it('빈 Results 배열이어도 크래시하지 않는다', async () => {
    const race = mockRace();
    race.Results = [];
    globalThis.getLastRaceResults = async () => ({
      data: race,
      timestamp: Date.now(),
      isStale: false,
    });
    await renderResults();
    assert.ok(panelHtml.includes('Australian Grand Prix'));
    assert.ok(!panelHtml.includes('podium--p1'));
  });
});
