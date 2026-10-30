'use strict';
const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, screen, powerMonitor } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeSettings } = require('./animation');
const smoke = process.argv.includes('--smoke-test');
if (smoke) app.setPath('userData', path.join(process.env.TMPDIR || require('node:os').tmpdir(), 'dafeiyu-smoke'));
app.setName('大肥鱼桌宠');
const locked = app.requestSingleInstanceLock();
let win, tray, settings, configFile, saveTimer, dragging, focusTimer, focusEnd = null;
let initialized = false;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { fs.mkdirSync(path.dirname(configFile), { recursive: true }); fs.writeFileSync(configFile, JSON.stringify(settings, null, 2)); }
    catch (error) { console.error('无法保存偏好：', error.message); }
  }, 250);
}
function clampPosition(x, y, width, height) {
  const area = screen.getDisplayNearestPoint({ x: Math.round(x + width / 2), y: Math.round(y + height / 2) }).workArea;
  return { x: Math.round(Math.max(area.x, Math.min(x, area.x + Math.max(0, area.width - width)))), y: Math.round(Math.max(area.y, Math.min(y, area.y + Math.max(0, area.height - height)))) };
}
function windowSize() { return { width: Math.max(196, Math.round(192 * settings.scale)), height: Math.round(208 * settings.scale) + 216 }; }
function applySettings(patch) {
  settings = normalizeSettings({ ...settings, ...patch });
  const old = win.getBounds(), size = windowSize();
  const position = clampPosition(old.x + old.width - size.width, old.y + old.height - size.height, size.width, size.height);
  win.setBounds({ ...position, ...size });
  win.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
  settings.position = position;
  win.webContents.send('settings:changed', settings); save(); updateTray();
}
function sendAction(name) { win.showInactive(); win.webContents.send('action:play', name); }
function sendMessage(message) { win.webContents.send('message', message); }
function showPet() { win.showInactive(); }
function startFocus(minutes) {
  clearTimeout(focusTimer); focusEnd = Date.now() + minutes * 60000;
  win.webContents.send('focus:changed', { endsAt: focusEnd });
  sendMessage(`开始专注 ${minutes} 分钟，我陪你。`);
  focusTimer = setTimeout(() => {
    focusEnd = null; win.webContents.send('focus:changed', { endsAt: null });
    sendAction('celebrate'); sendMessage('这一轮完成啦！休息一下吧。'); updateTray();
  }, minutes * 60000); updateTray();
}
function stopFocus() {
  clearTimeout(focusTimer); focusEnd = null;
  win.webContents.send('focus:changed', { endsAt: null }); updateTray();
}
function menuTemplate() {
  return [
    { label: '大肥鱼 · 你的桌面搭子', enabled: false },
    { type: 'separator' },
    { label: win.isVisible() ? '暂时隐藏' : '显示大肥鱼', click: () => win.isVisible() ? win.hide() : showPet() },
    { label: '甩甩鱼尾巴', click: () => sendAction('tail') },
    { label: '完成啦！抛、跳、接', click: () => sendAction('celebrate') },
    { label: '伸个懒腰', click: () => sendAction('stretch') },
    { label: '抱电脑打个盹', click: () => sendAction('sleep') },
    { label: '抱着电脑站起跳', click: () => sendAction('stand') },
    { label: '电脑摔坏了！赶紧修', click: () => sendAction('gag') },
    { label: '专注计时', submenu: [
      ...[5, 25, 45].map(n => ({ label: `${n} 分钟`, click: () => startFocus(n) })),
      { label: '结束本轮计时', enabled: focusEnd !== null, click: stopFocus }
    ] },
    { type: 'separator' },
    { label: '动画速度', submenu: [
      { label: '慢慢来 · 0.5×', value: 0.5 }, { label: '轻松 · 0.75×', value: 0.75 },
      { label: '正常 · 1×', value: 1 }, { label: '活泼 · 1.5×', value: 1.5 }
    ].map(x => ({ label: x.label, type: 'radio', checked: settings.speed === x.value, click: () => applySettings({ speed: x.value }) })) },
    { label: '宠物大小', submenu: [
      { label: '小', value: 0.8 }, { label: '标准', value: 1 }, { label: '大', value: 1.25 }, { label: '特大', value: 1.5 }
    ].map(x => ({ label: x.label, type: 'radio', checked: settings.scale === x.value, click: () => applySettings({ scale: x.value }) })) },
    { label: '鼠标碰到时甩尾', type: 'checkbox', checked: settings.hover, click: item => applySettings({ hover: item.checked }) },
    { label: '偶尔说句话和做小动作', type: 'checkbox', checked: settings.chatter, click: item => applySettings({ chatter: item.checked }) },
    { label: '减少动画', type: 'checkbox', checked: settings.reducedMotion, click: item => applySettings({ reducedMotion: item.checked }) },
    { label: '保持在其他窗口上方', type: 'checkbox', checked: settings.alwaysOnTop, click: item => applySettings({ alwaysOnTop: item.checked }) },
    { label: '移回屏幕右下角', click: resetPosition },
    { type: 'separator' },
    { label: '使用帮助', click: () => sendMessage('拖动移动 · 碰一下甩尾 · 双击庆祝 · 右键设置。计时结束也会庆祝。') },
    { label: '退出大肥鱼', accelerator: 'CommandOrControl+Q', click: () => app.quit() }
  ];
}
function updateTray() {
  if (!tray) return;
  tray.setToolTip(focusEnd ? '大肥鱼 · 正在专注' : '大肥鱼桌宠');
  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate()));
}
function resetPosition() {
  const area = screen.getPrimaryDisplay().workArea, size = win.getBounds();
  const pos = clampPosition(area.x + area.width - size.width - 36, area.y + area.height - size.height - 20, size.width, size.height);
  win.setPosition(pos.x, pos.y); settings.position = pos; save(); showPet();
}
function validSender(event) { return win && !win.isDestroyed() && event.sender === win.webContents; }
function validPoint(point) { return point && Number.isFinite(point.x) && Number.isFinite(point.y) && Math.abs(point.x) < 1e6 && Math.abs(point.y) < 1e6; }
function createPet() {
  configFile = path.join(app.getPath('userData'), 'preferences.json');
  try { settings = normalizeSettings(JSON.parse(fs.readFileSync(configFile, 'utf8'))); }
  catch { settings = normalizeSettings(); }
  const size = windowSize();
  const area = screen.getPrimaryDisplay().workArea;
  const desired = settings.position || { x: area.x + area.width - size.width - 36, y: area.y + area.height - size.height - 20 };
  const position = clampPosition(desired.x, desired.y, size.width, size.height);
  win = new BrowserWindow({
    ...size, ...position, title: '大肥鱼桌宠', transparent: true, backgroundColor: '#00000000',
    frame: false, resizable: false, maximizable: false, fullscreenable: false,
    skipTaskbar: true, alwaysOnTop: settings.alwaysOnTop, hasShadow: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: true }
  });
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  win.loadFile('index.html');
  const image = nativeImage.createFromPath(path.join(__dirname, 'assets', process.platform === 'darwin' ? 'trayTemplate.png' : 'icon.png'));
  if (process.platform === 'darwin') image.setTemplateImage(true);
  tray = new Tray(image.resize({ width: process.platform === 'darwin' ? 22 : 32, height: process.platform === 'darwin' ? 22 : 32 }));
  tray.on('click', showPet); updateTray();
  win.on('show', updateTray); win.on('hide', updateTray);
  win.on('moved', () => {
    if (!initialized) return;
    const bounds = win.getBounds(); settings.position = { x: bounds.x, y: bounds.y }; save();
  });
  screen.on('display-removed', resetPosition);
  powerMonitor.on('resume', () => {
    if (focusEnd && Date.now() >= focusEnd) { stopFocus(); sendAction('celebrate'); sendMessage('专注时间到了。'); }
  });
}
ipcMain.handle('settings:get', () => settings);
ipcMain.on('mouse:hit', (event, active) => { if (validSender(event) && !dragging) win.setIgnoreMouseEvents(active !== true, { forward: true }); });
ipcMain.on('menu:open', event => { if (validSender(event)) { win.setIgnoreMouseEvents(false); Menu.buildFromTemplate(menuTemplate()).popup({ window: win }); } });
ipcMain.on('action', (event, name) => { if (validSender(event) && ['tail', 'celebrate', 'stretch', 'sleep', 'stand', 'gag'].includes(name)) sendAction(name); });
ipcMain.on('drag:start', (event, point) => {
  if (!validSender(event) || !validPoint(point)) return;
  dragging = { ...point, origin: win.getPosition() }; win.setIgnoreMouseEvents(false);
});
ipcMain.on('drag:move', (event, point) => {
  if (!validSender(event) || !dragging || !validPoint(point)) return;
  const size = win.getBounds();
  const pos = clampPosition(dragging.origin[0] + point.x - dragging.x, dragging.origin[1] + point.y - dragging.y, size.width, size.height);
  win.setPosition(pos.x, pos.y);
});
ipcMain.on('drag:end', event => { if (validSender(event)) { dragging = null; const [x, y] = win.getPosition(); settings.position = { x, y }; save(); } });
ipcMain.on('renderer:ready', event => {
  if (!validSender(event)) return;
  initialized = true; win.showInactive();
  if (!fs.existsSync(configFile)) sendMessage('你好，我是大肥鱼。碰一下甩尾，双击庆祝，右键设置。');
  save();
  if (smoke) {
    setTimeout(async () => {
      try {
        const result = await win.webContents.executeJavaScript('JSON.stringify(window.__petDiagnostics())');
        console.log('DAFEIYU_SMOKE=' + result);
        const diagnostic = JSON.parse(result);
        if (!diagnostic.loaded || diagnostic.height !== 2704) throw new Error('Extended sprite did not load');
        for (const action of ['tail','celebrate','stretch','sleep','stand','gag']) {
          sendAction(action);
          await new Promise(resolve => setTimeout(resolve, 100));
          const check = JSON.parse(await win.webContents.executeJavaScript('JSON.stringify(window.__petDiagnostics())'));
          if (check.state !== action) throw new Error('Action failed: ' + action);
          if (check.layout && check.layout.bubbleBottom > check.layout.petTop) throw new Error('Bubble overlaps character');
          console.log('ACTION_PASS=' + action);
        }
        const destination = process.env.DAFEIYU_QA_DIR;
        if (destination) {
          await win.webContents.executeJavaScript("document.body.classList.add('show-controls')");
          await new Promise(resolve => setTimeout(resolve, 250));
          const icons = await win.webContents.executeJavaScript("Array.from(document.querySelectorAll('#toolbar img')).every(img => img.complete && img.naturalWidth > 0)");
          if (!icons) throw new Error('Head icons failed to load');
          fs.mkdirSync(destination, { recursive: true }); fs.writeFileSync(path.join(destination, 'desktop.png'), (await win.webContents.capturePage()).toPNG());
        }
        app.quit();
      } catch (error) { console.error(error); app.exit(1); }
    }, 1500);
  }
});
if (!locked) app.quit();
else {
  app.on('second-instance', () => { if (win) showPet(); });
  app.whenReady().then(createPet);
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => {
    clearTimeout(saveTimer); clearTimeout(focusTimer);
    if (settings && configFile) try { fs.writeFileSync(configFile, JSON.stringify(settings, null, 2)); } catch {}
  });
}
