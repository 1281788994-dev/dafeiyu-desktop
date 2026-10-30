'use strict';
const canvas = document.getElementById('pet'), ctx = canvas.getContext('2d', { willReadFrequently: true });
const { AnimationPlayer } = window.DafeiyuAnimation;
const player = new AnimationPlayer();
const sprite = new Image();
let settings = {}, loaded = false, lastTime = 0, frameKey = '', over = false, hitSent = null;
let pointer = null, moved = false, lastHoverAt = -Infinity, bubbleTimer, focusEnd = null;
const media = matchMedia('(prefers-reduced-motion: reduce)');
function paused() { player.paused = settings.reducedMotion || media.matches; }
function applySettings(next) { settings = next; player.speed = settings.speed; if (canvas.style) canvas.style.width = Math.round(192 * settings.scale) + 'px'; paused(); }
window.pet.onSettings(applySettings);
const lines = {
  tail: ['尾巴不是进度条，别催啦。', '碰我干嘛，想看甩尾巴呀？', '电脑抱稳，尾巴开摆。'],
  celebrate: ['接住！今天也是靠谱的大肥鱼。', '做完啦！电脑差点先下班。', '这一单，漂亮收工！'],
  stretch: ['伸个懒腰，脑洞就打开啦。', '肩膀放松，你也休息一下。', '久坐警告：起来活动两分钟！'],
  sleep: ['我只是闭眼整理一下思路。', '就眯一小会儿……电脑我抱着。', '电量不足，正在偷偷充电。'],
  stand: ['做完啦，抱紧电脑跳一下！', '电脑抱稳，快乐起飞。', '今天也值得庆祝一下。'],
  gag: ['完了……修好就当没发生。', '电脑别怕，我这就修！', '修好了！继续假装认真工作。']
};
let lastLine = '', nextSmallAction = 90000 + Math.random() * 90000;
function say(message) {
  const bubble = document.getElementById('bubble'); bubble.textContent = message; bubble.hidden = false;
  clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => { bubble.hidden = true; }, 5500);
}
function perform(name) {
  if (pointer || !player.play(name)) return;
  frameKey = '';
  if (settings.chatter && lines[name]) {
    const options = lines[name].filter(line => line !== lastLine);
    lastLine = options[Math.floor(Math.random() * options.length)]; say(lastLine);
  }
}
window.pet.onAction(perform);
window.pet.onMessage(say);
window.pet.onFocus(info => { focusEnd = info.endsAt; document.getElementById('timer').hidden = !focusEnd; });
media.addEventListener('change', paused);
function draw() {
  const { row, column } = player.frame;
  const key = `${row}:${column}`;
  if (loaded && key !== frameKey) {
    ctx.clearRect(0, 0, 192, 208);
    ctx.drawImage(sprite, column * 192, row * 208, 192, 208, 0, 0, 192, 208);
    frameKey = key;
  }
}
function tick(time) {
  player.tick(lastTime ? time - lastTime : 0); lastTime = time; draw(); requestAnimationFrame(tick);
}
function hitPet(event) {
  if (!loaded) return false;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * 192 / rect.width);
  const y = Math.floor((event.clientY - rect.top) * 208 / rect.height);
  return x >= 0 && x < 192 && y >= 0 && y < 208 && ctx.getImageData(x, y, 1, 1).data[3] > 40;
}
function updateHit(event) {
  if (pointer) return;
  const toolbar = !!event.target.closest?.('#toolbar');
  const hit = toolbar || hitPet(event);
  if (hitSent !== hit) { window.pet.hit(hit); hitSent = hit; }
  document.body.classList.toggle('over', hit);
  if (hit && !over && !toolbar && settings.hover && !player.paused && player.state === 'idle' && performance.now() - lastHoverAt > 6000) {
    lastHoverAt = performance.now(); perform('tail');
  }
  over = hit;
}
document.addEventListener('pointermove', event => {
  if (pointer) {
    if (Math.hypot(event.screenX - pointer.x, event.screenY - pointer.y) > 4) moved = true;
    if (moved) window.pet.dragMove(event.screenX, event.screenY);
  } else updateHit(event);
});
document.addEventListener('pointerleave', () => { if (!pointer) { over = false; document.body.classList.remove('over'); window.pet.hit(false); hitSent = false; } });
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !hitPet(event)) return;
  pointer = { id: event.pointerId, x: event.screenX, y: event.screenY }; moved = false;
  canvas.setPointerCapture(event.pointerId); window.pet.dragStart(event.screenX, event.screenY);
});
function endDrag(event) {
  if (!pointer) return;
  if (canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
  window.pet.dragEnd(); pointer = null; if (event) updateHit(event);
}
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('lostpointercapture', () => { if (pointer) { window.pet.dragEnd(); pointer = null; } });
canvas.addEventListener('dblclick', event => { if (!moved && hitPet(event)) window.pet.action('celebrate'); });
document.addEventListener('contextmenu', event => { event.preventDefault(); if (hitPet(event) || event.target.closest?.('#toolbar')) window.pet.menu(); });
document.getElementById('tail').onclick = () => window.pet.action('tail');
document.getElementById('celebrate').onclick = () => window.pet.action('celebrate');
for (const name of ['stretch','sleep','stand','gag']) document.getElementById(name).onclick = () => window.pet.action(name);
document.getElementById('menu').onclick = () => window.pet.menu();
canvas.addEventListener('keydown', event => {
  if (event.key === ' ') { event.preventDefault(); window.pet.action('tail'); }
  else if (event.key === 'Enter') window.pet.action('celebrate');
  else if (event.key === 'ContextMenu' || event.key === 'F10' && event.shiftKey) { event.preventDefault(); window.pet.menu(); }
});
document.addEventListener('focusin', () => { document.body.classList.add('show-controls'); window.pet.hit(true); });
window.addEventListener('blur', () => document.body.classList.remove('show-controls'));
setInterval(() => {
  if (!focusEnd) return;
  const seconds = Math.max(0, Math.ceil((focusEnd - Date.now()) / 1000));
  document.getElementById('timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}, 1000);
setInterval(() => {
  nextSmallAction -= 1000;
  if (nextSmallAction > 0) return;
  if (!loaded || pointer || focusEnd || player.state !== 'idle' || !settings.chatter || player.paused) return;
  const names = ['stretch', 'sleep'];
  perform(names[Math.floor(Math.random() * names.length)]);
  nextSmallAction = 90000 + Math.random() * 90000;
}, 1000);
window.__petDiagnostics = () => ({ loaded, state: player.state, frame: player.frame, width: sprite.naturalWidth, height: sprite.naturalHeight, settings,
  layout: { petTop: canvas.getBoundingClientRect().top, bubbleBottom: document.getElementById('bubble').getBoundingClientRect().bottom } });
sprite.onload = async () => { loaded = true; applySettings(await window.pet.getSettings()); draw(); window.pet.ready(); requestAnimationFrame(tick); };
sprite.onerror = () => { document.getElementById('bubble').hidden = false; document.getElementById('bubble').textContent = '宠物素材读取失败，请重新解压完整文件夹。'; };
sprite.src = 'assets/spritesheet.png';
