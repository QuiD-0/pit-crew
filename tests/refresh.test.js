const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage, loadSrc, storage } = require('./setup');

// renderCalendar, renderStandings, renderResults를 mock으로 정의
let renderCount = 0;
globalThis.renderCalendar = async () => { renderCount++; };
globalThis.renderStandings = async () => { renderCount++; };
globalThis.renderResults = async () => { renderCount++; };

loadSrc('src/cache.js');
loadSrc('src/refresh.js');

function createMockIcon(autoFire = true) {
  let iterationCb = null;
  return {
    addEventListener(evt, cb, opts) {
      if (evt === 'animationiteration') {
        if (autoFire) { Promise.resolve().then(cb); }
        else { iterationCb = cb; }
      }
    },
    _fireIteration() { if (iterationCb) { iterationCb(); iterationCb = null; } },
  };
}

function createMockBtn(iconOverride) {
  const classes = new Set();
  const icon = iconOverride || createMockIcon();
  return {
    disabled: false,
    offsetWidth: 100,
    querySelector() { return icon; },
    classList: {
      add(c) { classes.add(c); },
      remove(c) { classes.delete(c); },
      has(c) { return classes.has(c); },
    },
    _classes: classes,
    _icon: icon,
  };
}

describe('createRefreshHandler', () => {
  beforeEach(() => {
    resetStorage();
    renderCount = 0;
    globalThis.showToast = () => {};
  });

  it('클릭 시 캐시를 지우고 렌더 함수를 호출한다', async () => {
    storage.schedule = { data: [], timestamp: Date.now() };
    storage.results_r1 = { data: {}, timestamp: Date.now() };
    storage.standings_drivers = { data: [], timestamp: Date.now() };
    storage.standings_constructors = { data: [], timestamp: Date.now() };

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);
    await handler();

    assert.equal(storage.schedule.timestamp, 0);
    assert.equal(storage.results_r1.timestamp, 0);
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

    const icon = createMockIcon(false);
    const btn = createMockBtn(icon);
    const handler = createRefreshHandler(btn);

    // 첫 번째 클릭 (아직 완료 안 됨)
    const first = handler();
    // cacheInvalidate 내부 await들이 처리될 때까지 대기
    await new Promise(r => setTimeout(r, 0));
    // 두 번째, 세 번째 클릭 (무시되어야 함)
    await handler();
    await handler();

    // 첫 번째 완료
    resolveRender();
    await new Promise(r => setTimeout(r, 0));
    icon._fireIteration();
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

  it('API 실패 시 기존 데이터를 유지하고 showToast를 호출한다', async () => {
    storage.schedule = { data: [1], timestamp: Date.now() };
    storage.results_r1 = { data: {}, timestamp: Date.now() };
    storage.standings_drivers = { data: [], timestamp: Date.now() };
    storage.standings_constructors = { data: [], timestamp: Date.now() };

    let toastMsg = null;
    globalThis.showToast = (msg) => { toastMsg = msg; };

    globalThis.renderCalendar = async () => { throw new Error('offline'); };
    globalThis.renderStandings = async () => {};
    globalThis.renderResults = async () => {};

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);
    await handler();

    // cacheInvalidate로 timestamp가 0이 되지만 data는 보존됨
    assert.ok(storage.schedule.data);
    assert.equal(toastMsg, '연결 실패');
  });

  it('API 실패 후에도 버튼 상태가 복원된다', async () => {
    globalThis.renderCalendar = async () => { throw new Error('offline'); };
    globalThis.renderStandings = async () => {};
    globalThis.renderResults = async () => {};
    globalThis.showToast = () => {};

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);
    await handler();

    assert.equal(btn.disabled, false);
    assert.equal(btn._classes.has('header__btn--spinning'), false);
  });

  it('3개 render 모두 실패해도 토스트 1번만 호출된다', async () => {
    let toastCount = 0;
    globalThis.showToast = () => { toastCount++; };
    globalThis.renderCalendar = async () => { throw new Error('fail1'); };
    globalThis.renderStandings = async () => { throw new Error('fail2'); };
    globalThis.renderResults = async () => { throw new Error('fail3'); };

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);
    await handler();

    assert.equal(toastCount, 1);
  });

  it('애니메이션 사이클이 끝난 후에 spinning이 제거된다', async () => {
    globalThis.renderCalendar = async () => {};
    globalThis.renderStandings = async () => {};
    globalThis.renderResults = async () => {};

    const icon = createMockIcon(false);
    const btn = createMockBtn(icon);
    const handler = createRefreshHandler(btn);

    const done = handler();
    // 렌더가 완료될 때까지 대기
    await new Promise(r => setTimeout(r, 0));
    // 렌더 완료 후에도 아직 spinning 중
    assert.equal(btn._classes.has('header__btn--spinning'), true);
    assert.equal(btn.disabled, true);

    // 애니메이션 사이클 완료
    icon._fireIteration();
    await done;

    assert.equal(btn._classes.has('header__btn--spinning'), false);
    assert.equal(btn.disabled, false);
  });

  it('캐시가 비어있어도 refresh가 크래시하지 않는다', async () => {
    globalThis.renderCalendar = async () => {};
    globalThis.renderStandings = async () => {};
    globalThis.renderResults = async () => {};

    const btn = createMockBtn();
    const handler = createRefreshHandler(btn);
    await assert.doesNotReject(() => handler());
  });
});
