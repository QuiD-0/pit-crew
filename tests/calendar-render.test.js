const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadSrc } = require('./setup');

loadSrc('src/cache.js', 'src/toast.js', 'src/api.js', 'src/calendar.js');

describe('renderCalendar 우승자 표시', () => {
  let panel;
  beforeEach(() => {
    panel = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
    globalThis.document.getElementById = (id) => {
      if (id === 'panel-calendar') return panel;
      return { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
    };
  });

  const pastRace = {
    round: '1',
    raceName: 'Australian GP',
    date: '2020-03-15',
    time: '04:00:00Z',
    Circuit: { Location: { locality: 'Melbourne', country: 'Australia' } },
  };

  const futureRace = {
    round: '2',
    raceName: 'Chinese GP',
    date: '2099-04-10',
    time: '07:00:00Z',
    Circuit: { Location: { locality: 'Shanghai', country: 'China' } },
  };

  it('과거 레이스에 우승자를 표시한다', async () => {
    globalThis.getSchedule = async () => ({
      data: [pastRace, futureRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({
      data: { '1': { code: 'VER', time: '1:30:00' } },
      timestamp: Date.now(),
      isStale: false,
    });
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('🏆'));
    assert.ok(panel.innerHTML.includes('VER'));
    assert.ok(panel.innerHTML.includes('1:30:00'));
  });

  it('미래 레이스에는 우승자를 표시하지 않는다', async () => {
    globalThis.getSchedule = async () => ({
      data: [futureRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({
      data: {},
      timestamp: Date.now(),
      isStale: false,
    });
    await renderCalendar();
    assert.ok(!panel.innerHTML.includes('🏆'));
  });

  it('getSeasonWinners 실패해도 캘린더는 렌더링된다', async () => {
    globalThis.getSchedule = async () => ({
      data: [pastRace, futureRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => { throw new Error('fail'); };
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('Australian GP'));
    assert.ok(panel.innerHTML.includes('Chinese GP'));
    assert.ok(!panel.innerHTML.includes('🏆'));
  });

  it('다음 레이스 카드에 race-card--next 클래스가 붙는다', async () => {
    globalThis.getSchedule = async () => ({
      data: [pastRace, futureRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({ data: {}, timestamp: Date.now(), isStale: false });
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('race-card--next'));
  });

  it('과거 레이스 카드에 race-card--past 클래스가 붙는다', async () => {
    globalThis.getSchedule = async () => ({
      data: [pastRace, futureRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({ data: {}, timestamp: Date.now(), isStale: false });
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('race-card--past'));
  });

  it('다음 레이스는 open 속성이 있다', async () => {
    globalThis.getSchedule = async () => ({
      data: [pastRace, futureRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({ data: {}, timestamp: Date.now(), isStale: false });
    await renderCalendar();
    // "open" 속성이 next race에만 있어야 함
    const nextCardMatch = panel.innerHTML.match(/race-card--next[^>]*open/);
    assert.ok(nextCardMatch);
  });

  it('라운드 번호를 R1, R2 형식으로 표시한다', async () => {
    globalThis.getSchedule = async () => ({
      data: [pastRace, futureRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({ data: {}, timestamp: Date.now(), isStale: false });
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('R1'));
    assert.ok(panel.innerHTML.includes('R2'));
  });

  it('로케이션(도시, 국가)을 표시한다', async () => {
    globalThis.getSchedule = async () => ({
      data: [pastRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({ data: {}, timestamp: Date.now(), isStale: false });
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('Melbourne'));
    assert.ok(panel.innerHTML.includes('Australia'));
  });

  it('카운트다운이 다음 레이스에 표시된다', async () => {
    globalThis.getSchedule = async () => ({
      data: [futureRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({ data: {}, timestamp: Date.now(), isStale: false });
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('race-card__countdown'));
  });

  it('모든 레이스가 과거면 race-card--next가 없다', async () => {
    globalThis.getSchedule = async () => ({
      data: [pastRace],
      timestamp: Date.now(),
      isStale: false,
    });
    globalThis.getSeasonWinners = async () => ({ data: {}, timestamp: Date.now(), isStale: false });
    await renderCalendar();
    assert.ok(!panel.innerHTML.includes('race-card--next'));
  });
});
