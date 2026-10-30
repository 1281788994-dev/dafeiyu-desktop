const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pet', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  hit: (active) => ipcRenderer.send('mouse:hit', active === true),
  menu: () => ipcRenderer.send('menu:open'),
  dragStart: (x, y) => ipcRenderer.send('drag:start', { x, y }),
  dragMove: (x, y) => ipcRenderer.send('drag:move', { x, y }),
  dragEnd: () => ipcRenderer.send('drag:end'),
  action: (name) => ipcRenderer.send('action', name),
  ready: () => ipcRenderer.send('renderer:ready'),
  onSettings: (fn) => ipcRenderer.on('settings:changed', (_event, settings) => fn(settings)),
  onAction: (fn) => ipcRenderer.on('action:play', (_event, name) => fn(name)),
  onMessage: (fn) => ipcRenderer.on('message', (_event, message) => fn(message)),
  onFocus: (fn) => ipcRenderer.on('focus:changed', (_event, info) => fn(info))
});
