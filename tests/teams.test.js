const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadSrc } = require('./setup');

loadSrc('src/teams.js');

describe('F1_TEAMS 데이터 무결성', () => {
  it('f1 기본 테마가 존재한다', () => {
    assert.ok(F1_TEAMS.f1);
    assert.equal(F1_TEAMS.f1.name, 'F1');
  });

  it('모든 팀의 primaryLight 색상이 유효한 hex 코드이다', () => {
    for (const [team, data] of Object.entries(F1_TEAMS)) {
      assert.match(data.primaryLight, /^#[0-9A-Fa-f]{6}$/, `${team}: ${data.primaryLight}는 유효한 hex가 아님`);
    }
  });

  it('팀 ID에 공백이 없다', () => {
    for (const id of Object.keys(F1_TEAMS)) {
      assert.ok(!id.includes(' '), `${id}에 공백이 있음`);
    }
  });

  it('12개 팀이 정의되어 있다', () => {
    assert.equal(Object.keys(F1_TEAMS).length, 12);
  });
});

describe('getConstructorColor 엣지 케이스', () => {
  it('null을 전달하면 기본 색상을 반환한다', () => {
    assert.equal(getConstructorColor(null), '#888');
  });

  it('숫자를 전달해도 크래시하지 않는다', () => {
    assert.equal(getConstructorColor(123), '#888');
  });
});
