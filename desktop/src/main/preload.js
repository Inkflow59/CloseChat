const { contextBridge, ipcRenderer } = require('electron')

// Bridge minimale : le renderer (nodeIntegration=false) pilote la couche LAN via IPC.
contextBridge.exposeInMainWorld('closechatLan', {
  hostStart: (args) => ipcRenderer.invoke('lan:hostStart', args),
  hostCreateRoom: (args) => ipcRenderer.invoke('lan:hostCreateRoom', args),
  hostGetRooms: () => ipcRenderer.invoke('lan:hostGetRooms'),
  clientJoin: (args) => ipcRenderer.invoke('lan:clientJoin', args),
  clientSendMessage: (args) => ipcRenderer.invoke('lan:clientSendMessage', args),
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

