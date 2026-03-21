const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadSrc } = require('./setup');

loadSrc('src/cache.js', 'src/toast.js', 'src/api.js', 'src/calendar.js');

describe('formatLocalDate', () => {
  it('유효한 날짜/시간을 파싱한다', () => {
    const result = formatLocalDate('2026-03-15', '07:00:00Z');
    assert.ok(result.date);
    assert.ok(result.time);
    assert.ok(result.weekday);
  });

  it('date는 "Mon DD" 포맷이다', () => {
    const result = formatLocalDate('2026-12-25', '12:00:00Z');
    assert.match(result.date, /\w+ \d+/);
  });

  it('time은 HH:MM 포맷이다', () => {
    const result = formatLocalDate('2026-06-01', '14:30:00Z');
    assert.match(result.time, /\d{2}:\d{2}/);
  });

  it('weekday는 짧은 요일명이다', () => {
    const result = formatLocalDate('2026-03-16', '04:00:00Z');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    assert.ok(days.some(d => result.weekday.includes(d)));
  });
});

describe('getSessionList', () => {
  it('일반 레이스 위크엔드 세션을 반환한다', () => {
    const race = {
      date: '2026-03-15',
      time: '04:00:00Z',
      FirstPractice: { date: '2026-03-13', time: '01:30:00Z' },
      SecondPractice: { date: '2026-03-13', time: '05:00:00Z' },
      ThirdPractice: { date: '2026-03-14', time: '01:30:00Z' },
      Qualifying: { date: '2026-03-14', time: '05:00:00Z' },
    };
    const sessions = getSessionList(race);
    assert.equal(sessions.length, 5);
    assert.deepEqual(sessions.map(s => s.name), ['FP1', 'FP2', 'FP3', 'Qualifying', 'Race']);
  });

  it('스프린트 위크엔드 세션을 반환한다', () => {
    const race = {
      date: '2026-03-22',
      time: '07:00:00Z',
      FirstPractice: { date: '2026-03-20', time: '03:30:00Z' },
      Qualifying: { date: '2026-03-21', time: '07:00:00Z' },
      Sprint: { date: '2026-03-21', time: '03:00:00Z' },
      SprintQualifying: { date: '2026-03-20', time: '07:30:00Z' },
    };
    const sessions = getSessionList(race);
    assert.equal(sessions.length, 5);
    assert.ok(sessions.some(s => s.name === 'Sprint'));
    assert.ok(sessions.some(s => s.name === 'Sprint Quali'));
  });

  it('Race 세션은 항상 마지막이다', () => {
    const race = { date: '2026-06-01', time: '14:00:00Z' };
    const sessions = getSessionList(race);
    assert.equal(sessions[sessions.length - 1].name, 'Race');
  });

  it('race.time이 없으면 00:00:00Z로 폴백한다', () => {
    const race = { date: '2026-06-01' };
    const sessions = getSessionList(race);
    assert.equal(sessions[0].time, '00:00:00Z');
  });
});

describe('isNextRace', () => {
  it('미래 레이스는 true를 반환한다', () => {
    assert.equal(isNextRace({ date: '2099-12-31', time: '12:00:00Z' }), true);
  });

  it('과거 레이스는 false를 반환한다', () => {
    assert.equal(isNextRace({ date: '2020-01-01', time: '12:00:00Z' }), false);
  });

  it('time이 없으면 00:00:00Z로 폴백한다', () => {
    assert.equal(isNextRace({ date: '2099-12-31' }), true);
  });
});

describe('getCountdown', () => {
  it('과거 레이스는 null을 반환한다', () => {
    assert.equal(getCountdown({ date: '2020-01-01', time: '12:00:00Z' }), null);
  });

  it('미래 레이스는 카운트다운 문자열을 반환한다', () => {
    const result = getCountdown({ date: '2099-12-31', time: '12:00:00Z' });
    assert.ok(result);
    assert.match(result, /\d+d \d+h/);
  });

  it('24시간 이내면 시간+분 형식이다', () => {
    const later = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const race = {
      date: later.toISOString().split('T')[0],
      time: later.toISOString().split('T')[1],
    };
    const result = getCountdown(race);
    assert.ok(result);
    assert.match(result, /\d+h \d+m/);
  });
});

describe('renderCalendar', () => {
  const mockRace = {
    round: '1',
    raceName: 'Australian Grand Prix',
    date: '2099-03-15',
    time: '04:00:00Z',
    Circuit: { Location: { locality: 'Melbourne', country: 'Australia' } },
    FirstPractice: { date: '2099-03-13', time: '01:30:00Z' },
    Qualifying: { date: '2099-03-14', time: '05:00:00Z' },
  };

  let panel;
  beforeEach(() => {
    panel = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
    const origGetById = globalThis.document.getElementById;
    globalThis.document.getElementById = (id) => {
      if (id === 'panel-calendar') return panel;
      return origGetById(id);
    };
  });

  it('stale 데이터일 때 stale-notice를 표시한다', async () => {
    const ts = Date.now() - (3 * 60 * 60 * 1000);
    globalThis.getSchedule = async () => ({
      data: [mockRace],
      timestamp: ts,
      isStale: true,
    });
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('stale-notice'));
    assert.ok(panel.innerHTML.includes('3시간 전'));
  });

  it('fresh 데이터일 때 stale-notice를 표시하지 않는다', async () => {
    globalThis.getSchedule = async () => ({
      data: [mockRace],
      timestamp: Date.now(),
      isStale: false,
    });
    await renderCalendar();
    assert.ok(!panel.innerHTML.includes('stale-notice'));
  });

  it('빈 레이스 배열 + stale → stale notice만 표시', async () => {
    const ts = Date.now() - (5 * 60 * 60 * 1000);
    globalThis.getSchedule = async () => ({
      data: [],
      timestamp: ts,
      isStale: true,
    });
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('stale-notice'));
    assert.ok(!panel.innerHTML.includes('race-card'));
  });

  it('API 에러 시 에러 메시지를 표시한다 (stale 캐시 없음)', async () => {
    globalThis.getSchedule = async () => { throw new Error('network error'); };
    await renderCalendar();
    assert.ok(panel.innerHTML.includes('Failed to load calendar'));
    assert.ok(panel.innerHTML.includes('network error'));
  });
});
