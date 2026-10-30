'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Animation = require('../app/animation');

async function setup(patch = {}) {
  const sent = [], events = {}, handlers = {}, elements = {};
  let now = 10000, alpha = 255;
  function element(id) {
    if (elements[id]) return elements[id];
    const listeners = {};
    return elements[id] = {
      id, listeners, hidden: true, textContent: '',
      addEventListener(type, fn) { listeners[type] = fn; },
      getContext() { return { clearRect() {}, drawImage() {}, getImageData() { return { data: [0, 0, 0, alpha] }; } }; },
      getBoundingClientRect() { return { left: 0, top: 0, bottom: 0, width: 192, height: 208 }; },
      setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture() { return false; }
    };
  }
  const context = {
    window: {
      DafeiyuAnimation: Animation,
      addEventListener() {},
      pet: {
        onSettings(fn) { handlers.settings = fn; }, onAction(fn) { handlers.action = fn; },
        onMessage(fn) { handlers.message = fn; }, onFocus(fn) { handlers.focus = fn; },
        getSettings: async () => Animation.normalizeSettings(patch),
        hit: active => sent.push(['hit', active]), menu: () => sent.push(['menu']),
        dragStart: (x, y) => sent.push(['drag:start', x, y]), dragMove: (x, y) => sent.push(['drag:move', x, y]),
        dragEnd: () => sent.push(['drag:end']), action: name => sent.push(['action', name]), ready: () => sent.push(['ready'])
      }
    },
    document: {
      getElementById: element,
      body: { classList: { toggle() {}, add() {}, remove() {} } },
      addEventListener(type, fn) { events[type] = fn; }
    },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    Image: class { constructor() { this.naturalWidth = 1536; this.naturalHeight = 1872; } set src(value) { this.onload(); } },
    performance: { now: () => now },
    requestAnimationFrame() {}, setInterval() {}, setTimeout() {}, clearTimeout() {}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../app/renderer.js'), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  const event = { clientX: 80, clientY: 80, screenX: 500, screenY: 400, button: 0, pointerId: 1, target: { closest: () => null } };
  return { sent, context, events, handlers, elements, event, setAlpha(v) { alpha = v; }, setTime(v) { now = v; } };
}
test('鼠标碰到有效像素时进入甩尾，透明区允许鼠标穿过', async () => {
  const s = await setup();
  s.events.pointermove(s.event);
  assert.equal(s.context.window.__petDiagnostics().state, 'tail');
  assert.deepEqual(s.sent.at(-1), ['hit', true]);
  s.setAlpha(0); s.events.pointermove(s.event);
  assert.deepEqual(s.sent.at(-1), ['hit', false]);
});
test('关闭悬停互动后，碰到角色不会自动甩尾', async () => {
  const s = await setup({ hover: false }); s.events.pointermove(s.event);
  assert.equal(s.context.window.__petDiagnostics().state, 'idle');
});
test('双击会请求庆祝，拖拽会传递屏幕坐标', async () => {
  const s = await setup();
  s.elements.pet.listeners.dblclick(s.event);
  assert.deepEqual(s.sent.at(-1), ['action', 'celebrate']);
  s.elements.pet.listeners.pointerdown(s.event);
  assert.deepEqual(s.sent.at(-1), ['drag:start', 500, 400]);
  s.events.pointermove({ ...s.event, screenX: 540, screenY: 430 });
  assert.deepEqual(s.sent.at(-1), ['drag:move', 540, 430]);
  s.elements.pet.listeners.pointerup(s.event);
  assert.ok(s.sent.some(x => x[0] === 'drag:end'));
});
test('接收到庆祝事件时正确选择庆祝行，右键能打开菜单', async () => {
  const s = await setup();
  s.handlers.action('celebrate');
  assert.equal(s.context.window.__petDiagnostics().state, 'celebrate');
  s.events.contextmenu({ ...s.event, preventDefault() {} });
  assert.deepEqual(s.sent.at(-1), ['menu']);
});
test('新动作配套显示台词，关闭说话后不显示新气泡', async () => {
  const s = await setup(); s.handlers.action('stretch');
  assert.equal(s.context.window.__petDiagnostics().state,'stretch');
  assert.equal(s.elements.bubble.hidden,false); assert.ok(s.elements.bubble.textContent.length>0);
  const quiet = await setup({chatter:false}); quiet.handlers.action('sleep');
  assert.equal(quiet.context.window.__petDiagnostics().state,'sleep');
  assert.equal(quiet.elements.bubble.hidden,true);
  assert.equal(quiet.elements.bubble.textContent,'');
});
test('四个新增头像按钮分别触发对应动作', async () => {
  const s = await setup();
  for (const name of ['stretch','sleep','stand','gag']) {
    s.elements[name].onclick(); assert.deepEqual(s.sent.at(-1),['action',name]);
  }
});
