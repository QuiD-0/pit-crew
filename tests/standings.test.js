const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadSrc } = require('./setup');

loadSrc('src/standings.js');

describe('getConstructorColor', () => {
  it('알려진 팀 ID에 대해 올바른 색상을 반환한다', () => {
    assert.equal(getConstructorColor('ferrari'), '#E8002D');
    assert.equal(getConstructorColor('mercedes'), '#27F4D2');
    assert.equal(getConstructorColor('red_bull'), '#3671C6');
    assert.equal(getConstructorColor('mclaren'), '#FF8000');
    assert.equal(getConstructorColor('aston_martin'), '#229971');
    assert.equal(getConstructorColor('alpine'), '#0093CC');
    assert.equal(getConstructorColor('williams'), '#1868DB');
    assert.equal(getConstructorColor('rb'), '#6692FF');
    assert.equal(getConstructorColor('haas'), '#B6BABD');
    assert.equal(getConstructorColor('sauber'), '#52E252');
    assert.equal(getConstructorColor('cadillac'), '#1E4D2B');
  });

  it('알 수 없는 팀 ID에 대해 기본 색상을 반환한다', () => {
    assert.equal(getConstructorColor('unknown_team'), '#888');
    assert.equal(getConstructorColor(''), '#888');
    assert.equal(getConstructorColor(undefined), '#888');
  });

  it('모든 현재 F1 팀이 정의되어 있다', () => {
    const teams = ['mercedes', 'ferrari', 'red_bull', 'mclaren', 'aston_martin',
                   'alpine', 'williams', 'rb', 'haas', 'sauber', 'cadillac'];
    for (const team of teams) {
      assert.notEqual(getConstructorColor(team), '#888', `${team} 색상이 없음`);
    }
  });
});

describe('CONSTRUCTOR_COLORS', () => {
  it('모든 색상이 유효한 hex 코드이다', () => {
    for (const [team, color] of Object.entries(CONSTRUCTOR_COLORS)) {
      assert.match(color, /^#[0-9A-Fa-f]{6}$/, `${team}: ${color}는 유효한 hex가 아님`);
    }
  });
});
