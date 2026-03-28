const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { loadSrc } = require('./setup');

loadSrc('src/toast.js');

describe('showToast', () => {
  let el;
  beforeEach(() => {
    el = {
      textContent: '',
      hidden: true,
      _classes: new Set(),
      classList: {
        add(c) { el._classes.add(c); },
        remove(c) { el._classes.delete(c); },
      },
    };
    globalThis.document.getElementById = (id) => {
      if (id === 'toast') return el;
      return { innerHTML: '' };
    };
  });

  it('토스트 메시지를 설정하고 visible 상태로 만든다', () => {
    showToast('테스트 메시지');
    assert.equal(el.textContent, '테스트 메시지');
    assert.equal(el.hidden, false);
    assert.ok(el._classes.has('toast--visible'));
  });

  it('빈 문자열도 표시한다', () => {
    showToast('');
    assert.equal(el.textContent, '');
    assert.equal(el.hidden, false);
  });
});

describe('timeAgo 경계값', () => {
  it('59초는 방금 전', () => {
    assert.equal(timeAgo(Date.now() - 59000), '방금 전');
  });

  it('61초는 1분 전', () => {
    assert.equal(timeAgo(Date.now() - 61000), '1분 전');
  });

  it('119분은 분 단위', () => {
    // 119분 = 1시간 59분 → 시간 단위
    assert.equal(timeAgo(Date.now() - 119 * 60000), '1시간 전');
  });

  it('미래 타임스탬프는 방금 전', () => {
    // Date.now() + 10000 → diff가 음수 → mins < 1
    assert.equal(timeAgo(Date.now() + 10000), '방금 전');
  });
});
