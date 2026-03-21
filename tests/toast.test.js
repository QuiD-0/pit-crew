const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadSrc } = require('./setup');

loadSrc('src/toast.js');

describe('timeAgo', () => {
  it('1분 미만이면 "방금 전"을 반환한다', () => {
    assert.equal(timeAgo(Date.now() - 30000), '방금 전');
  });

  it('분 단위를 반환한다', () => {
    assert.equal(timeAgo(Date.now() - 5 * 60000), '5분 전');
  });

  it('시간 단위를 반환한다', () => {
    assert.equal(timeAgo(Date.now() - 3 * 60 * 60000), '3시간 전');
  });

  it('일 단위를 반환한다', () => {
    assert.equal(timeAgo(Date.now() - 2 * 24 * 60 * 60000), '2일 전');
  });

  it('59분은 분 단위로 반환한다', () => {
    assert.equal(timeAgo(Date.now() - 59 * 60000), '59분 전');
  });

  it('23시간은 시간 단위로 반환한다', () => {
    assert.equal(timeAgo(Date.now() - 23 * 60 * 60000), '23시간 전');
  });
});
