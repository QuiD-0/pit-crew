const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc } = require('./setup');

loadSrc('src/teams.js', 'src/cache.js', 'src/toast.js', 'src/api.js', 'src/results.js');

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

const baseSchedule = [
  { round: '1', raceName: 'Australian GP', date: '2025-03-01', time: '05:00:00Z' },
  { round: '2', raceName: 'Chinese GP', date: '2025-03-15', time: '07:00:00Z' },
  { round: '3', raceName: 'Japanese GP', date: '2025-03-29', time: '05:00:00Z' },
];

const baseRace = {
  raceName: 'Australian Grand Prix',
  round: '1',
  date: '2025-03-01',
  time: '05:00:00Z',
  Circuit: { circuitName: 'Albert Park' },
  Results: [
    { position: '1', points: '25', Driver: { code: 'VER' }, Constructor: { constructorId: 'red_bull' }, Time: { time: '1:30:00' }, status: 'Finished' },
    { position: '2', points: '18', Driver: { code: 'HAM' }, Constructor: { constructorId: 'mercedes' }, Time: { time: '+5.0' }, status: 'Finished' },
    { position: '3', points: '15', Driver: { code: 'LEC' }, Constructor: { constructorId: 'ferrari' }, Time: { time: '+10.0' }, status: 'Finished' },
  ],
};

describe('renderResults 라운드 선택', () => {
  beforeEach(() => {
    resetStorage();
    mock.restoreAll();
    panelHtml = '';
    selectListener = null;
    globalThis.currentRound = null;
  });

  it('currentRound가 null이면 마지막 과거 라운드의 결과를 표시한다', async () => {
    let requestedRound = null;
    globalThis.getSchedule = async () => ({ data: baseSchedule, timestamp: Date.now(), isStale: false });
    globalThis.getRaceResults = async (round) => {
      requestedRound = round;
      return { data: { ...baseRace, round }, timestamp: Date.now(), isStale: false };
    };
    await renderResults();
    // 3개 모두 과거이므로 마지막인 round 3이 요청됨
    assert.equal(requestedRound, '3');
  });

  it('미래 레이스만 있으면 "No results available" 표시', async () => {
    const futureSchedule = [
      { round: '1', raceName: 'Future GP', date: '2099-12-01', time: '05:00:00Z' },
    ];
    globalThis.getSchedule = async () => ({ data: futureSchedule, timestamp: Date.now(), isStale: false });
    await renderResults();
    assert.ok(panelHtml.includes('No results available'));
  });

  it('팀 색상이 올바르게 적용된다', async () => {
    globalThis.getSchedule = async () => ({ data: baseSchedule, timestamp: Date.now(), isStale: false });
    globalThis.getRaceResults = async () => ({ data: baseRace, timestamp: Date.now(), isStale: false });
    await renderResults();
    assert.ok(panelHtml.includes('#3671C6')); // red_bull
    assert.ok(panelHtml.includes('#27F4D2')); // mercedes
    assert.ok(panelHtml.includes('#E8002D')); // ferrari
  });

  it('Finished 상태 + Time 있는 나머지 드라이버는 Time을 표시한다', async () => {
    const raceWith11 = { ...baseRace, Results: [] };
    for (let i = 1; i <= 12; i++) {
      raceWith11.Results.push({
        position: String(i),
        points: String(Math.max(0, 26 - i * 2)),
        Driver: { code: `DR${i}` },
        Constructor: { constructorId: 'mercedes' },
        Time: { time: `+${i}.000` },
        status: 'Finished',
      });
    }
    globalThis.getSchedule = async () => ({ data: baseSchedule, timestamp: Date.now(), isStale: false });
    globalThis.getRaceResults = async () => ({ data: raceWith11, timestamp: Date.now(), isStale: false });
    await renderResults();
    // 11위, 12위 드라이버가 rest 섹션에 표시됨
    assert.ok(panelHtml.includes('DR11'));
    assert.ok(panelHtml.includes('DR12'));
    assert.ok(panelHtml.includes('Show remaining drivers'));
  });
});
