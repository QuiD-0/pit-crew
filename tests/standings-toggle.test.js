const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadSrc } = require('./setup');

loadSrc('src/teams.js', 'src/toast.js', 'src/standings.js');

describe('renderStandings HTML 구조', () => {
  const mockDrivers = [
    { position: '1', points: '200', Driver: { givenName: 'Max', familyName: 'Verstappen' }, Constructors: [{ constructorId: 'red_bull', name: 'Red Bull' }] },
    { position: '2', points: '150', Driver: { givenName: 'Lewis', familyName: 'Hamilton' }, Constructors: [{ constructorId: 'ferrari', name: 'Ferrari' }] },
  ];
  const mockConstructors = [
    { position: '1', points: '400', Constructor: { constructorId: 'red_bull', name: 'Red Bull' } },
    { position: '2', points: '350', Constructor: { constructorId: 'ferrari', name: 'Ferrari' } },
  ];

  let panel, clickListeners;
  beforeEach(() => {
    clickListeners = [];
    panel = {
      innerHTML: '',
      querySelector: () => null,
      querySelectorAll(sel) {
        if (sel === '.standings-toggle__btn') {
          return clickListeners.map(l => l.btn);
        }
        return [];
      },
    };
    globalThis.document.getElementById = (id) => {
      if (id === 'panel-standings') return panel;
      if (id === 'standings-drivers') return { style: { display: '' } };
      if (id === 'standings-constructors') return { style: { display: 'none' } };
      return { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
    };
    globalThis.getDriverStandings = async () => ({ data: mockDrivers, timestamp: Date.now(), isStale: false });
    globalThis.getConstructorStandings = async () => ({ data: mockConstructors, timestamp: Date.now(), isStale: false });
  });

  it('드라이버 이름(givenName + familyName)을 표시한다', async () => {
    await renderStandings();
    assert.ok(panel.innerHTML.includes('Max'));
    assert.ok(panel.innerHTML.includes('Verstappen'));
    assert.ok(panel.innerHTML.includes('Lewis'));
    assert.ok(panel.innerHTML.includes('Hamilton'));
  });

  it('컨스트럭터 이름을 표시한다', async () => {
    await renderStandings();
    assert.ok(panel.innerHTML.includes('Red Bull'));
    assert.ok(panel.innerHTML.includes('Ferrari'));
  });

  it('포인트를 pts 접미사와 함께 표시한다', async () => {
    await renderStandings();
    assert.ok(panel.innerHTML.includes('200'));
    assert.ok(panel.innerHTML.includes('pts'));
  });

  it('팀 색상이 적용된다', async () => {
    await renderStandings();
    assert.ok(panel.innerHTML.includes('#3671C6')); // red_bull
    assert.ok(panel.innerHTML.includes('#E8002D')); // ferrari
  });

  it('Drivers/Constructors 토글 버튼이 표시된다', async () => {
    await renderStandings();
    assert.ok(panel.innerHTML.includes('data-type="drivers"'));
    assert.ok(panel.innerHTML.includes('data-type="constructors"'));
  });

  it('standings-drivers 패널이 기본 표시, constructors는 숨겨진다', async () => {
    await renderStandings();
    assert.ok(panel.innerHTML.includes('id="standings-drivers"'));
    assert.ok(panel.innerHTML.includes('id="standings-constructors" style="display:none"'));
  });

  it('Constructors가 없는 드라이버도 크래시하지 않는다', async () => {
    globalThis.getDriverStandings = async () => ({
      data: [{ position: '1', points: '100', Driver: { givenName: 'Test', familyName: 'Driver' }, Constructors: [] }],
      timestamp: Date.now(),
      isStale: false,
    });
    await renderStandings();
    assert.ok(panel.innerHTML.includes('Test'));
  });
});
