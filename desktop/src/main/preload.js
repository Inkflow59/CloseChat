const { contextBridge, ipcRenderer } = require('electron')

// Capture les erreurs JS non catchées dans le renderer et les relaie au main process.
window.addEventListener('error', (event) => {
  ipcRenderer.invoke('crash:reportRenderer', {
    exception: event.message,
    stack: event.error?.stack || '',
    source: `${event.filename}:${event.lineno}:${event.colno}`,
  }).catch(() => {})
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  ipcRenderer.invoke('crash:reportRenderer', {
    exception: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack || '' : '',
    source: 'unhandledRejection',
  }).catch(() => {})
})

// Bridge minimale : le renderer (nodeIntegration=false) pilote la couche LAN via IPC.
contextBridge.exposeInMainWorld('closechatLan', {
  hostStart: (args) => ipcRenderer.invoke('lan:hostStart', args),
  hostCreateRoom: (args) => ipcRenderer.invoke('lan:hostCreateRoom', args),
  hostGetRooms: () => ipcRenderer.invoke('lan:hostGetRooms'),
  clientJoin: (args) => ipcRenderer.invoke('lan:clientJoin', args),
  clientSendMessage: (args) => ipcRenderer.invoke('lan:clientSendMessage', args),
  notify: (args) => ipcRenderer.invoke('app:notify', args),
  clientProfileUpdate: (args) => ipcRenderer.invoke('lan:clientProfileUpdate', args),
  clientRename: (args) => ipcRenderer.invoke('lan:clientRename', args),
  hostGetRoomDetails: (args) => ipcRenderer.invoke('lan:hostGetRoomDetails', args),
  hostKickClient: (args) => ipcRenderer.invoke('lan:hostKickClient', args),
  hostBanClient: (args) => ipcRenderer.invoke('lan:hostBanClient', args),
  hostUpdateRoom: (args) => ipcRenderer.invoke('lan:hostUpdateRoom', args),
  signLocalToken: (args) => ipcRenderer.invoke('lan:signLocalToken', args),
  clientLeave: () => ipcRenderer.invoke('lan:clientLeave'),
  hostDeleteRoom: (args) => ipcRenderer.invoke('lan:hostDeleteRoom', args),
  getLocalIP: () => ipcRenderer.invoke('lan:getLocalIP'),
  discoverAndListRooms: (args) => ipcRenderer.invoke('lan:discoverAndListRooms', args),

  onMessage: (cb) => {
    ipcRenderer.removeAllListeners('lan:message')
    ipcRenderer.on('lan:message', (_, msg) => cb(msg))
  },
})

