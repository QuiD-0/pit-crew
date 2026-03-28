const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc, storage } = require('./setup');

loadSrc('src/teams.js', 'src/themes.js');

describe('initThemes', () => {
  let cssVars, dataset, gridChildren, modeSwitchClasses, clickHandlers;

  beforeEach(() => {
    resetStorage();
    cssVars = {};
    dataset = {};
    gridChildren = [];
    modeSwitchClasses = new Set();
    clickHandlers = {};

    globalThis.document.documentElement.style.setProperty = (k, v) => { cssVars[k] = v; };
    globalThis.document.documentElement.dataset = dataset;

    globalThis.document.getElementById = (id) => {
      if (id === 'mode-switch') return {
        addEventListener(evt, fn) { clickHandlers['mode-switch'] = fn; },
        classList: {
          toggle(cls, force) {
            if (force) modeSwitchClasses.add(cls);
            else modeSwitchClasses.delete(cls);
          },
        },
      };
      if (id === 'theme-grid') return {
        innerHTML: '',
        appendChild(child) { gridChildren.push(child); },
        querySelector(sel) {
          const match = sel.match(/\[data-theme="(.+?)"\]/);
          if (!match) return null;
          return gridChildren.find(c => c.dataset.theme === match[1]) || null;
        },
      };
      if (id === 'settings-modal') return { hidden: false };
      return { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
    };

    globalThis.document.createElement = (tag) => {
      const classes = new Set();
      const el = {
        className: '',
        dataset: {},
        innerHTML: '',
        addEventListener(evt, fn) { el._clickHandler = fn; },
        classList: {
          add(c) { classes.add(c); },
          remove(c) { classes.delete(c); },
          has(c) { return classes.has(c); },
        },
        _classes: classes,
        _clickHandler: null,
      };
      return el;
    };

    globalThis.document.querySelectorAll = (sel) => {
      if (sel === '.theme-swatch') return gridChildren;
      return [];
    };
  });

  it('모든 팀의 swatch를 theme-grid에 추가한다', () => {
    initThemes();
    assert.equal(gridChildren.length, Object.keys(F1_TEAMS).length);
  });

  it('기본 테마(f1)의 CSS 변수가 설정된다', () => {
    initThemes();
    // storage에 theme이 없으므로 'f1' 기본값
    // chrome.storage.local.get 콜백에서 applyTheme('f1') 호출
    assert.equal(cssVars['--color-primary'], '#e10600');
  });

  it('저장된 테마가 있으면 해당 테마로 설정된다', () => {
    storage.theme = 'ferrari';
    initThemes();
    assert.equal(cssVars['--color-primary'], '#E8002D');
  });

  it('저장된 모드가 light면 light 모드가 적용된다', () => {
    storage.mode = 'light';
    initThemes();
    assert.equal(dataset.mode, 'light');
    assert.ok(modeSwitchClasses.has('mode-toggle--light'));
  });

  it('기본 모드는 dark이다', () => {
    initThemes();
    assert.equal(dataset.mode, undefined);
    assert.ok(!modeSwitchClasses.has('mode-toggle--light'));
  });

  it('mode-switch 클릭 시 light↔dark 전환한다', () => {
    initThemes();
    // 기본은 dark → 클릭하면 light
    clickHandlers['mode-switch']();
    assert.equal(dataset.mode, 'light');
    assert.equal(storage.mode, 'light');
    // 다시 클릭하면 dark
    clickHandlers['mode-switch']();
    assert.equal(dataset.mode, undefined);
    assert.equal(storage.mode, 'dark');
  });
});
