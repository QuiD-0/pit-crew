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
let selectListener = null;
const origGetById = globalThis.document.getElementById;
globalThis.document.getElementById = (id) => {
  if (id === 'panel-results') return mockPanel;
  if (id === 'round-select') return {
    addEventListener(evt, fn) { selectListener = fn; },
    value: '',
  };
  return origGetById(id);
};

function mockRace(overrides = {}) {
  return {
    raceName: 'Australian Grand Prix',
    round: '1',
    date: '2025-03-01',
    time: '05:00:00Z',
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

const mockSchedule = [
  { round: '1', raceName: 'Australian Grand Prix', date: '2025-03-01', time: '05:00:00Z' },
];

function mockApis(race, schedule) {
  const sched = schedule || mockSchedule;
  globalThis.getSchedule = async () => ({ data: sched, timestamp: Date.now(), isStale: false });
  globalThis.getRaceResults = async () => ({ data: race, timestamp: Date.now(), isStale: false });
}

describe('renderResults', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
    panelHtml = '';
    selectListener = null;
    globalThis.currentRound = null;
  });

  it('완료된 레이스가 없으면 안내 메시지를 표시한다', async () => {
    globalThis.getSchedule = async () => ({ data: [], timestamp: Date.now(), isStale: false });
    await renderResults();
    assert.ok(panelHtml.includes('No results available yet'));
  });

  it('레이스명과 서킷명을 표시한다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(panelHtml.includes('Australian Grand Prix'));
    assert.ok(panelHtml.includes('Albert Park Grand Prix Circuit'));
    assert.ok(panelHtml.includes('Round 1'));
  });

  it('포디움 3명을 렌더링한다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(panelHtml.includes('podium--p1'));
    assert.ok(panelHtml.includes('podium--p2'));
    assert.ok(panelHtml.includes('podium--p3'));
    assert.ok(panelHtml.includes('RUS'));
    assert.ok(panelHtml.includes('ANT'));
    assert.ok(panelHtml.includes('LEC'));
  });

  it('P1 시간을 표시한다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(panelHtml.includes('1:33:15.607'));
  });

  it('포인트가 있는 드라이버는 +포인트를 표시한다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(panelHtml.includes('+25'));
    assert.ok(panelHtml.includes('+18'));
  });

  it('0포인트 드라이버는 빈 문자열을 표시한다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(!panelHtml.includes('+0'));
  });

  it('리타이어 드라이버는 status를 표시한다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(panelHtml.includes('Retired'));
  });

  it('11위 이하 드라이버는 접힌 섹션에 표시한다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(panelHtml.includes('Show remaining drivers'));
    assert.ok(panelHtml.includes('STR'));
    assert.ok(panelHtml.includes('TSU'));
  });

  it('패스티스트 랩을 표시한다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(panelHtml.includes('Fastest Lap'));
    assert.ok(panelHtml.includes('RUS'));
    assert.ok(panelHtml.includes('1:35.275'));
  });

  it('패스티스트 랩 데이터가 없으면 섹션을 표시하지 않는다', async () => {
    const race = mockRace();
    race.Results.forEach(r => delete r.FastestLap);
    mockApis(race);
    await renderResults();
    assert.ok(!panelHtml.includes('Fastest Lap'));
  });

  it('Constructor가 없어도 크래시하지 않는다', async () => {
    const race = mockRace();
    race.Results[0].Constructor = undefined;
    mockApis(race);
    await renderResults();
    assert.ok(panelHtml.includes('RUS'));
  });

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    globalThis.getSchedule = async () => { throw new Error('API error: 500'); };
    await renderResults();
    assert.ok(panelHtml.includes('Failed to load results'));
  });

  it('결과가 10명 이하면 접힌 섹션을 표시하지 않는다', async () => {
    const race = mockRace();
    race.Results = race.Results.slice(0, 5);
    mockApis(race);
    await renderResults();
    assert.ok(!panelHtml.includes('Show remaining drivers'));
  });

  it('Time이 없는 P1은 status로 폴백한다', async () => {
    const race = mockRace();
    delete race.Results[0].Time;
    mockApis(race);
    await renderResults();
    assert.ok(panelHtml.includes('Finished'));
  });

  it('stale 데이터일 때 stale-notice를 표시한다', async () => {
    const ts = Date.now() - (3 * 60 * 60 * 1000);
    globalThis.getSchedule = async () => ({ data: mockSchedule, timestamp: Date.now(), isStale: false });
    globalThis.getRaceResults = async () => ({
      data: mockRace(),
      timestamp: ts,
      isStale: true,
    });
    await renderResults();
    assert.ok(panelHtml.includes('stale-notice'));
    assert.ok(panelHtml.includes('3시간 전'));
  });

  it('fresh 데이터일 때 stale-notice를 표시하지 않는다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(!panelHtml.includes('stale-notice'));
  });

  it('결과 없음일 때 null data를 처리한다', async () => {
    mockApis(null);
    await renderResults();
    assert.ok(panelHtml.includes('No results available yet'));
  });

  it('결과가 3명 미만이어도 크래시하지 않는다', async () => {
    const race = mockRace();
    race.Results = race.Results.slice(0, 2);
    mockApis(race);
    await renderResults();
    assert.ok(panelHtml.includes('podium--p1'));
    assert.ok(panelHtml.includes('podium--p2'));
    assert.ok(!panelHtml.includes('podium--p3'));
  });

  it('빈 Results 배열이어도 크래시하지 않는다', async () => {
    const race = mockRace();
    race.Results = [];
    mockApis(race);
    await renderResults();
    assert.ok(panelHtml.includes('Australian Grand Prix'));
    assert.ok(!panelHtml.includes('podium--p1'));
  });

  it('라운드 드롭다운이 표시된다', async () => {
    mockApis(mockRace());
    await renderResults();
    assert.ok(panelHtml.includes('round-select'));
    assert.ok(panelHtml.includes('<option'));
  });

  it('여러 라운드가 있으면 모두 드롭다운에 표시된다', async () => {
    const schedule = [
      { round: '1', raceName: 'Australian GP', date: '2025-03-01', time: '05:00:00Z' },
      { round: '2', raceName: 'Chinese GP', date: '2025-03-15', time: '07:00:00Z' },
    ];
    mockApis(mockRace(), schedule);
    await renderResults();
    assert.ok(panelHtml.includes('R1 Australian GP'));
    assert.ok(panelHtml.includes('R2 Chinese GP'));
  });
});
