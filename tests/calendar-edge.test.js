const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadSrc } = require('./setup');

loadSrc('src/cache.js', 'src/toast.js', 'src/api.js', 'src/calendar.js');

describe('formatLocalDate 엣지 케이스', () => {
  it('자정 시간을 처리한다', () => {
    const result = formatLocalDate('2026-01-01', '00:00:00Z');
    assert.ok(result.date);
    assert.ok(result.time);
  });

  it('23:59 시간을 처리한다', () => {
    const result = formatLocalDate('2026-06-15', '23:59:00Z');
    assert.ok(result.time);
  });
});

describe('getSessionList 엣지 케이스', () => {
  it('모든 세션이 있는 레이스 (FP1~FP3 + Quali + Sprint + SprintQuali)', () => {
    const race = {
      date: '2026-03-22',
      time: '07:00:00Z',
      FirstPractice: { date: '2026-03-20', time: '01:30:00Z' },
      SecondPractice: { date: '2026-03-20', time: '05:00:00Z' },
      ThirdPractice: { date: '2026-03-21', time: '01:30:00Z' },
      Qualifying: { date: '2026-03-21', time: '05:00:00Z' },
      Sprint: { date: '2026-03-21', time: '03:00:00Z' },
      SprintQualifying: { date: '2026-03-20', time: '07:30:00Z' },
    };
    const sessions = getSessionList(race);
    assert.equal(sessions.length, 7);
    assert.equal(sessions[sessions.length - 1].name, 'Race');
  });

  it('FP1만 있는 레이스', () => {
    const race = {
      date: '2026-06-01',
      time: '14:00:00Z',
      FirstPractice: { date: '2026-05-30', time: '10:00:00Z' },
    };
    const sessions = getSessionList(race);
    assert.equal(sessions.length, 2);
    assert.equal(sessions[0].name, 'FP1');
    assert.equal(sessions[1].name, 'Race');
  });
});

describe('getCountdown 엣지 케이스', () => {
  it('정확히 1일 남았을 때 "1d 0h" 형식이다', () => {
    const later = new Date(Date.now() + 24 * 60 * 60 * 1000 + 1000);
    const race = {
      date: later.toISOString().split('T')[0],
      time: later.toISOString().split('T')[1],
    };
    const result = getCountdown(race);
    assert.ok(result);
    assert.match(result, /1d 0h/);
  });

  it('time이 없는 미래 레이스도 카운트다운을 반환한다', () => {
    const result = getCountdown({ date: '2099-12-31' });
    assert.ok(result);
  });
});

describe('isNextRace 엣지 케이스', () => {
  it('오늘 날짜의 과거 시간 레이스는 false', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000);
    assert.equal(isNextRace({
      date: past.toISOString().split('T')[0],
      time: past.toISOString().split('T')[1],
    }), false);
  });
});
