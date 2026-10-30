'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { AnimationPlayer, normalizeSettings, clips } = require('../app/animation');
function advance(player, ms) { while (ms > 0) { const step = Math.min(ms, 100); player.tick(step); ms -= step; } }
test('鼠标甩尾动作完整播放后回到办公，而非卡在甩尾', () => {
  const p = new AnimationPlayer(); p.speed = 1; p.play('tail');
  advance(p, clips.tail.times.reduce((a, b) => a + b, 0) - 1);
  assert.equal(p.state, 'tail'); advance(p, 1); assert.equal(p.state, 'idle');
});
test('0.5 倍速的庆祝实际持续两倍时间', () => {
  const slow = new AnimationPlayer(), normal = new AnimationPlayer();
  slow.speed = 0.5; normal.speed = 1; slow.play('celebrate'); normal.play('celebrate');
  const duration = clips.celebrate.times.reduce((a, b) => a + b, 0);
  advance(slow, duration); advance(normal, duration);
  assert.equal(normal.state, 'idle'); assert.equal(slow.state, 'celebrate');
  advance(slow, duration); assert.equal(slow.state, 'idle');
});
test('暂停和减少动画不会继续推进到下一帧', () => {
  const p = new AnimationPlayer(); p.paused = true; advance(p, 5000);
  assert.deepEqual(p.frame, { row: 0, column: 0 });
});
test('无效偏好会回到可用尺寸和速度，并保留多屏负坐标', () => {
  const s = normalizeSettings({ speed: 0, scale: 9000, position: { x: -1200, y: 40 }, hover: false });
  assert.equal(s.speed, 0.75); assert.equal(s.scale, 1.25); assert.equal(s.hover, false);
  assert.deepEqual(s.position, { x: -1200, y: 40 });
  assert.equal(normalizeSettings({ position: { x: Infinity, y: 1 } }).position, null);
});
test('待机循环不会越出素材表的有效格子', () => {
  const p = new AnimationPlayer();
  for (let i = 0; i < 6000; i++) { p.tick(100); assert.equal(p.frame.row, 0); assert.ok(p.frame.column >= 0 && p.frame.column <= 5); }
});
test('新增和恢复动作完整播放后回到办公', () => {
  for (const [name,row] of [['stretch',9],['sleep',10],['stand',11],['gag',12]]) {
    const p = new AnimationPlayer(); p.speed = 1; p.play(name);
    assert.equal(p.frame.row,row);
    advance(p,clips[name].times.reduce((a,b)=>a+b,0));
    assert.equal(p.state,'idle');
  }
});
