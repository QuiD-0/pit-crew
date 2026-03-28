const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc, storage } = require('./setup');

loadSrc('src/teams.js', 'src/themes.js');

describe('applyTheme', () => {
  let cssVars;
  beforeEach(() => {
    resetStorage();
    cssVars = {};
    globalThis.document.documentElement.style.setProperty = (k, v) => { cssVars[k] = v; };
  });

  it('알려진 팀 ID로 CSS 변수를 설정한다', () => {
    applyTheme('ferrari');
    assert.equal(cssVars['--color-primary'], '#E8002D');
    assert.equal(cssVars['--color-primary-light'], '#ff1a45');
  });

  it('알 수 없는 팀 ID는 f1 기본값으로 폴백한다', () => {
    applyTheme('unknown');
    assert.equal(cssVars['--color-primary'], '#e10600');
    assert.equal(cssVars['--color-primary-light'], '#ff1e00');
  });

  it('스토리지에 테마를 저장한다', () => {
    applyTheme('mclaren');
    assert.equal(storage.theme, 'mclaren');
  });
});

describe('applyMode', () => {
  let dataset;
  beforeEach(() => {
    resetStorage();
    dataset = {};
    globalThis.document.documentElement.dataset = dataset;
  });

  it('light 모드를 설정한다', () => {
    applyMode('light');
    assert.equal(dataset.mode, 'light');
    assert.equal(storage.mode, 'light');
  });

  it('dark 모드는 dataset.mode를 제거한다', () => {
    dataset.mode = 'light';
    applyMode('dark');
    assert.equal(dataset.mode, undefined);
    assert.equal(storage.mode, 'dark');
  });
});
