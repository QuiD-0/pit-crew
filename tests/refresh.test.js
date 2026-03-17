const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc, storage } = require('./setup');

// renderCalendar, renderStandings, renderResults를 mock으로 정의
let renderCount = 0;
globalThis.renderCalendar = async () => { renderCount++; };
globalThis.renderStandings = async () => { renderCount++; };
globalThis.renderResults = async () => { renderCount++; };

loadSrc('src/refresh.js');

function createMockBtn() {
  const classes = new Set();
  return {
    disabled: false,
    classList: {
      add(c) { classes.add(c); },
      remove(c) { classes.delete(c); },
      has(c) { return classes.has(c); },
    },
    _classes: classes,
  };
}

describe('createRefreshHandler', () => {
  beforeEach(() => {
    resetStorage();
    renderCount = 0;
  });

  it('클릭 시 캐시를 지우고 렌더 함수를 호출한다', async () => {
    storage.schedule = { data: [], timestamp: Date.now() };
    storage.results = { data: {}, timestamp: Date.now() };

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);
    await handler();

    assert.equal(storage.schedule, undefined);
    assert.equal(storage.results, undefined);
    assert.equal(renderCount, 3);
  });

  it('실행 중에는 버튼이 disabled 되고 spinning 클래스가 붙는다', async () => {
    let capturedDisabled = null;
    let capturedSpinning = null;

    globalThis.renderCalendar = async () => {
      capturedDisabled = btn.disabled;
      capturedSpinning = btn._classes.has('header__btn--spinning');
    };
    globalThis.renderStandings = async () => {};
    globalThis.renderResults = async () => {};

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);
    await handler();

    assert.equal(capturedDisabled, true);
    assert.equal(capturedSpinning, true);
    // 완료 후 복구
    assert.equal(btn.disabled, false);
    assert.equal(btn._classes.has('header__btn--spinning'), false);
  });

  it('실행 중 중복 클릭은 무시된다', async () => {
    let callCount = 0;
    let resolveRender;
    globalThis.renderCalendar = () => new Promise(r => { resolveRender = r; callCount++; });
    globalThis.renderStandings = async () => {};
    globalThis.renderResults = async () => {};

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);

    // 첫 번째 클릭 (아직 완료 안 됨)
    const first = handler();
    // 두 번째, 세 번째 클릭 (무시되어야 함)
    await handler();
    await handler();

    // 첫 번째 완료
    resolveRender();
    await first;

    assert.equal(callCount, 1);
  });

  it('완료 후 다시 클릭하면 정상 작동한다', async () => {
    let callCount = 0;
    globalThis.renderCalendar = async () => { callCount++; };
    globalThis.renderStandings = async () => {};
    globalThis.renderResults = async () => {};

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);

    await handler();
    await handler();

    assert.equal(callCount, 2);
  });
});
