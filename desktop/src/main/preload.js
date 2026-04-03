const { contextBridge, ipcRenderer } = require('electron')

// Bridge minimale : le renderer (nodeIntegration=false) pilote la couche LAN via IPC.
contextBridge.exposeInMainWorld('closechatLan', {
  hostStart: (args) => ipcRenderer.invoke('lan:hostStart', args),
  hostCreateRoom: (args) => ipcRenderer.invoke('lan:hostCreateRoom', args),
  clientJoin: (args) => ipcRenderer.invoke('lan:clientJoin', args),
  clientSendMessage: (args) => ipcRenderer.invoke('lan:clientSendMessage', args),

  onMessage: (cb) => {
    ipcRenderer.removeAllListeners('lan:message')
    ipcRenderer.on('lan:message', (_, msg) => cb(msg))
  },
})

