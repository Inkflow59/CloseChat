const { app, BrowserWindow, crashReporter, ipcMain, Notification, Tray, Menu, dialog, nativeImage } = require('electron')
const path = require('path')

function getResourcePath(filename) {
  if (app.isPackaged) return path.join(process.resourcesPath, filename)
  return path.join(__dirname, '..', '..', 'resources', filename)
}

const enableCrashReporting = process.env.CRASH_REPORTING_ENABLED !== 'false'
const crashSubmitURL =
  process.env.CRASH_REPORT_SUBMIT_URL || 'http://localhost:6767/crash'

const fs = require('fs')
const { generateKeyPairSync } = require('crypto')

const secretsDir =
  process.env.JWT_SECRETS_DIR ||
  (app.isPackaged
    ? path.join(app.getPath('userData'), 'secrets')
    : path.join(__dirname, '..', '..', '..', 'secrets'))
const jwtPrivatePath = path.join(secretsDir, 'jwt_private.pem')
const jwtPublicPath = path.join(secretsDir, 'jwt_public.pem')

function readJwtPem(filePath) {
  try {
    if (!fs.existsSync(filePath)) return ''
    return fs.readFileSync(filePath, 'utf8')
  } catch (_) {
    return ''
  }
}

function ensureJwtKeysOnDisk() {
  if (fs.existsSync(jwtPrivatePath) && fs.existsSync(jwtPublicPath)) return
  fs.mkdirSync(secretsDir, { recursive: true })
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  fs.writeFileSync(jwtPrivatePath, privateKey, 'utf8')
  fs.writeFileSync(jwtPublicPath, publicKey, 'utf8')
}

function getJwtKeys() {
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
    return {
      privateKey: process.env.JWT_PRIVATE_KEY,
      publicKey: process.env.JWT_PUBLIC_KEY,
    }
  }
  ensureJwtKeysOnDisk()
  return {
    privateKey: readJwtPem(jwtPrivatePath),
    publicKey: readJwtPem(jwtPublicPath),
  }
}

let mainWindow = null
let tray = null
let isQuitting = false
let lanServer = null
let lanRooms = new Map() // roomName -> { passwordHashHex: string|null, clients: Set<WebSocket>, createdAt }
let lanServerPort = null

let lanClientSocket = null
let lanClientRoom = null
let lanBanned = new Map() // roomName -> Set<userId>

if (enableCrashReporting) {
  // Envoie automatique des crashs au backend self-hosted.
  crashReporter.start({
    submitURL: crashSubmitURL,
    uploadToServer: true,
    extra: {
      appVersion: app.getVersion(),
      platform: process.platform,
    },
  })

  // Capture les exceptions JS non catchées dans le process principal.
  process.on('uncaughtException', (err) => {
    fetch(crashSubmitURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exception: err?.message || String(err),
        stack: err?.stack || '',
        platform: process.platform,
        appVersion: app.getVersion(),
        processType: 'main',
      }),
    }).catch(() => {})
  })

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason))
    fetch(crashSubmitURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exception: err.message,
        stack: err.stack || '',
        platform: process.platform,
        appVersion: app.getVersion(),
        processType: 'main-unhandledRejection',
      }),
    }).catch(() => {})
  })
}

async function waitForDevServer(url, timeoutMs = 20000, intervalMs = 250) {
  const startedAt = Date.now()
  // On évite de planter au premier `loadURL` si Vite n'est pas encore prêt
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return true
    } catch (_) {
      // serveur pas encore disponible
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return false
}

function getTrayIcon() {
  try {
    const img = nativeImage.createFromPath(getResourcePath('tray.png'))
    if (!img.isEmpty()) return img
  } catch (_) {}
  return nativeImage.createEmpty()
}

function setupTray() {
  tray = new Tray(getTrayIcon())
  tray.setToolTip('CloseChat')

  const buildMenu = () => Menu.buildFromTemplate([
    {
      label: 'Afficher CloseChat',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Démarrage automatique',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked })
        tray.setContextMenu(buildMenu())
      },
    },
    { type: 'separator' },
    { label: 'Quitter', click: () => { isQuitting = true; app.quit() } },
  ])

  tray.setContextMenu(buildMenu())
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function createWindow({ devUrl, isDev }) {
  const iconPath = getResourcePath('icon.ico')
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
  mainWindow = win

  // Minimiser dans le tray au lieu de fermer
  win.on('close', (e) => {
    if (tray && !isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })

  if (isDev) {
    win.loadURL(devUrl)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.join(__dirname, '..', '..', 'dist', 'renderer', 'index.html')
    win.loadFile(indexPath)
  }
}

app.whenReady().then(async () => {
  const isDev = process.env.NODE_ENV !== 'production'
  const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'

  if (isDev) {
    const ok = await waitForDevServer(devUrl, 30000)
    if (!ok) console.warn(`Electron: impossible de joindre ${devUrl} (timeout).`)
  }

  createWindow({ devUrl, isDev })
  setupTray()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow({ devUrl, isDev })
  })
})

function sha256Hex(input) {
  const { createHash } = require('crypto')
  return createHash('sha256').update(String(input)).digest('hex')
}

function verifyJWT(token) {
  const jwt = require('jsonwebtoken')
  const { publicKey } = getJwtKeys()
  if (!publicKey) {
    throw new Error('JWT_PUBLIC_KEY manquant (pour le LAN).')
  }
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] })
}

function broadcastToRoom(room, payload) {
  const roomState = lanRooms.get(room)
  if (!roomState) return
  const msg = JSON.stringify(payload)
  for (const ws of roomState.clients) {
    // ws.readyState: 1 == OPEN (constante statique WebSocket.OPEN).
    if (ws.readyState === 1) ws.send(msg)
  }
}

function trySendToRenderer(payload) {
  if (!mainWindow) return
  mainWindow.webContents.send('lan:message', payload)
}

ipcMain.handle('lan:hostStart', async (event, args = {}) => {
  const wsLib = require('ws')
  const { port } = args
  const listenPort = Number(port) || 5050

  const { publicKey } = getJwtKeys()
  if (!publicKey) {
    throw new Error('JWT_PUBLIC_KEY manquant : configure une clé publique persistante.')
  }

  // Si un serveur existe déjà, on le réutilise.
  if (lanServer) return { ok: true, port: lanServerPort }

  lanServerPort = listenPort
  lanServer = new wsLib.Server({ port: listenPort })
  lanRooms = new Map()

  lanServer.on('connection', (ws) => {
    ws.__lanIP = ((ws._socket?.remoteAddress) || 'unknown').replace('::ffff:', '')
    ws.on('message', (data) => {
      let msg
      try {
        msg = JSON.parse(data.toString('utf8'))
      } catch (_) {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }))
        return
      }

      const { type } = msg || {}

      if (type === 'join_room') {
        try {
          const { room, token, roomPassword, profile } = msg
          const payload = verifyJWT(token)
          const username = payload.username || payload.sub

          if (!room) return ws.send(JSON.stringify({ type: 'join_room_ack', ok: false, error: 'Missing room' }))

          if (!lanRooms.has(room)) {
            return ws.send(
              JSON.stringify({ type: 'join_room_ack', ok: false, error: 'Room not found' }),
            )
          }

          const roomState = lanRooms.get(room)
          const banned = lanBanned.get(room)
          if (banned && banned.has(payload.sub)) {
            return ws.send(JSON.stringify({ type: 'join_room_ack', ok: false, error: 'Vous êtes banni de ce salon.' }))
          }
          if (roomState.passwordHashHex) {
            if (!roomPassword) {
              return ws.send(
                JSON.stringify({ type: 'join_room_ack', ok: false, error: 'Password required' }),
              )
            }
            const candidate = sha256Hex(roomPassword)
            if (candidate !== roomState.passwordHashHex) {
              return ws.send(
                JSON.stringify({ type: 'join_room_ack', ok: false, error: 'Wrong password' }),
              )
            }
          }

          roomState.clients.add(ws)
          ws.__lanRoom = room
          const safeProfile = profile && typeof profile === 'object'
            ? { avatar_emoji: profile.avatar_emoji || '😊', status: profile.status || 'available', bio: profile.bio || '' }
            : { avatar_emoji: '😊', status: 'available', bio: '' }

          ws.__lanUser = { userId: payload.sub, username, ip: ws.__lanIP || 'unknown', profile: safeProfile }

          const existingMembersWithProfiles = [...roomState.clients]
            .filter((c) => c.__lanUser)
            .map((c) => ({ username: c.__lanUser.username, profile: c.__lanUser.profile || {} }))

          ws.send(JSON.stringify({
            type: 'join_room_ack',
            ok: true,
            room,
            members: existingMembersWithProfiles.map((m) => m.username),
            memberProfiles: existingMembersWithProfiles,
            history: roomState.messages,
          }))

          broadcastToRoom(room, {
            type: 'presence',
            room,
            action: 'join',
            user: { userId: payload.sub, username },
            profile: safeProfile,
            at: new Date().toISOString(),
          })
        } catch (err) {
          ws.send(JSON.stringify({ type: 'join_room_ack', ok: false, error: err?.message || 'Unauthorized' }))
        }
        return
      }

      if (type === 'send_message') {
        try {
          const { room, token, message } = msg
          const payload = verifyJWT(token)
          const username = payload.username || payload.sub

          if (!room || !message) {
            return ws.send(JSON.stringify({ type: 'send_message_ack', ok: false, error: 'Missing room/message' }))
          }
          const roomState = lanRooms.get(room)
          if (!roomState || !roomState.clients.has(ws)) {
            return ws.send(JSON.stringify({ type: 'send_message_ack', ok: false, error: 'Not joined to room' }))
          }

          const m = String(message)
          const at = new Date().toISOString()
          const entry = { from: { userId: payload.sub, username }, message: m, at }
          roomState.messages.push(entry)
          if (roomState.messages.length > 200) roomState.messages.shift()
          broadcastToRoom(room, { type: 'message', room, ...entry })

          ws.send(JSON.stringify({ type: 'send_message_ack', ok: true }))
        } catch (err) {
          ws.send(JSON.stringify({ type: 'send_message_ack', ok: false, error: err?.message || 'Unauthorized' }))
        }
        return
      }

      if (type === 'user_rename') {
        try {
          const { room, token, newUsername } = msg
          const payload = verifyJWT(token)
          if (!newUsername?.trim()) return
          const roomState = lanRooms.get(room)
          if (!roomState || !roomState.clients.has(ws)) return
          const oldUsername = ws.__lanUser?.username
          ws.__lanUser = { ...ws.__lanUser, username: newUsername.trim() }
          broadcastToRoom(room, {
            type: 'user_renamed',
            room,
            oldUsername,
            newUsername: newUsername.trim(),
            userId: payload.sub,
            at: new Date().toISOString(),
          })
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', error: err?.message || 'Rename failed' }))
        }
        return
      }

      if (type === 'profile_update') {
        try {
          const { room, token, profile } = msg
          const payload = verifyJWT(token)
          const username = payload.username || payload.sub
          const roomState = lanRooms.get(room)
          if (!roomState || !roomState.clients.has(ws)) return
          broadcastToRoom(room, {
            type: 'profile_updated',
            username,
            profile,
            at: new Date().toISOString(),
          })
        } catch (_) {}
        return
      }

      if (type === 'list_rooms') {
        const rooms = []
        for (const [roomName, roomState] of lanRooms.entries()) {
          const members = [...roomState.clients]
            .filter((c) => c.__lanUser)
            .map((c) => c.__lanUser.username)
          rooms.push({
            name: roomName,
            protected: Boolean(roomState.passwordHashHex),
            members,
          })
        }
        ws.send(JSON.stringify({ type: 'list_rooms_ack', rooms }))
        return
      }

      ws.send(JSON.stringify({ type: 'error', error: `Unknown type: ${type}` }))
    })

    ws.on('close', () => {
      const room = ws.__lanRoom
      if (!room) return
      const roomState = lanRooms.get(room)
      if (!roomState) return
      roomState.clients.delete(ws)
      if (roomState.clients.size === 0) {
        lanRooms.delete(room)
        return
      }
      broadcastToRoom(room, {
        type: 'presence',
        room,
        action: 'leave',
        user: ws.__lanUser || null,
        at: new Date().toISOString(),
      })
    })
  })

  return { ok: true, port: lanServerPort }
})

ipcMain.handle('lan:hostCreateRoom', async (event, args = {}) => {
  const { room, roomPassword } = args
  if (!room) throw new Error('Missing room')

  const passwordHashHex = roomPassword ? sha256Hex(roomPassword) : null
  lanRooms.set(room, {
    passwordHashHex,
    clients: new Set(),
    createdAt: new Date().toISOString(),
    messages: [],
  })

  return { ok: true, room, protected: Boolean(passwordHashHex) }
})

ipcMain.handle('lan:clientJoin', async (event, args = {}) => {
  const wsLib = require('ws')
  const { url, room, token, roomPassword, profile } = args

  if (!url || !room || !token) {
    throw new Error('clientJoin requires { url, room, token }')
  }

  lanClientRoom = room

  if (lanClientSocket) {
    try {
      lanClientSocket.close()
    } catch (_) {}
    lanClientSocket = null
  }

  const socket = new wsLib.WebSocket(url)
  lanClientSocket = socket

  return await new Promise((resolve, reject) => {
    socket.on('open', () => {
      socket.send(
        JSON.stringify({
          type: 'join_room',
          room,
          token,
          roomPassword: roomPassword || null,
          profile: profile || null,
        }),
      )
    })

    socket.on('message', (data) => {
      let msg
      try {
        msg = JSON.parse(data.toString('utf8'))
      } catch (_) {
        return
      }

      if (msg.type === 'join_room_ack') {
        if (!msg.ok) return reject(new Error(msg.error || 'join failed'))
        trySendToRenderer(msg)
        return resolve({ ok: true, room, members: msg.members || [], memberProfiles: msg.memberProfiles || [], history: msg.history || [] })
      }

      // events de diffusion
      trySendToRenderer(msg)
    })

    socket.on('error', (err) => {
      reject(err)
    })
  })
})

ipcMain.handle('lan:clientSendMessage', async (event, args = {}) => {
  const { message, room, token } = args
  if (!lanClientSocket || lanClientSocket.readyState !== 1) {
    throw new Error('Not connected to a LAN host.')
  }
  const r = room || lanClientRoom
  if (!r || !message || !token) throw new Error('Missing { room/message/token }')

  lanClientSocket.send(
    JSON.stringify({
      type: 'send_message',
      room: r,
      token,
      message,
    }),
  )

  return { ok: true }
})

ipcMain.handle('app:notify', async (event, args = {}) => {
  if (!mainWindow) return
  if (mainWindow.isFocused() && !mainWindow.isMinimized()) return
  if (!Notification.isSupported()) return

  const { title, body } = args
  if (!title || !body) return

  const notif = new Notification({
    title: String(title),
    body: String(body).length > 120 ? String(body).slice(0, 117) + '…' : String(body),
  })
  notif.once('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
  notif.show()
})

ipcMain.handle('crash:reportRenderer', async (event, args = {}) => {
  if (!enableCrashReporting) return
  fetch(crashSubmitURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exception: args.exception || 'Unknown renderer error',
      stack: args.stack || '',
      source: args.source || '',
      platform: process.platform,
      appVersion: app.getVersion(),
      processType: 'renderer',
    }),
  }).catch(() => {})
})

ipcMain.handle('lan:clientProfileUpdate', async (event, args = {}) => {
  const { room, token, profile } = args
  if (lanClientSocket && lanClientSocket.readyState === 1) {
    lanClientSocket.send(JSON.stringify({ type: 'profile_update', room, token, profile }))
  }
  return { ok: true }
})

ipcMain.handle('lan:clientRename', async (event, args = {}) => {
  const { newUsername, room, token } = args
  if (lanClientSocket && lanClientSocket.readyState === 1) {
    lanClientSocket.send(JSON.stringify({ type: 'user_rename', room, token, newUsername }))
  }
  return { ok: true }
})

ipcMain.handle('lan:hostGetRoomDetails', async (event, args = {}) => {
  const { room } = args
  const roomState = lanRooms.get(room)
  if (!roomState) return { members: [] }
  const members = [...roomState.clients]
    .filter((c) => c.__lanUser)
    .map((c) => ({ userId: c.__lanUser.userId, username: c.__lanUser.username, ip: c.__lanUser.ip || 'unknown' }))
  return { members }
})

ipcMain.handle('lan:hostKickClient', async (event, args = {}) => {
  const { room, userId } = args
  const roomState = lanRooms.get(room)
  if (!roomState) throw new Error('Salon introuvable')
  for (const ws of roomState.clients) {
    if (ws.__lanUser?.userId === userId) {
      ws.close()
      return { ok: true }
    }
  }
  return { ok: false }
})

ipcMain.handle('lan:hostBanClient', async (event, args = {}) => {
  const { room, userId } = args
  const roomState = lanRooms.get(room)
  if (!roomState) throw new Error('Salon introuvable')
  if (!lanBanned.has(room)) lanBanned.set(room, new Set())
  lanBanned.get(room).add(userId)
  for (const ws of roomState.clients) {
    if (ws.__lanUser?.userId === userId) {
      ws.close()
      break
    }
  }
  return { ok: true }
})

ipcMain.handle('lan:hostUpdateRoom', async (event, args = {}) => {
  const { room, newName, newPassword } = args
  const roomState = lanRooms.get(room)
  if (!roomState) throw new Error('Salon introuvable')
  if (newPassword) {
    roomState.passwordHashHex = sha256Hex(newPassword)
  }
  const finalName = (newName && newName.trim() && newName.trim() !== room) ? newName.trim() : room
  if (finalName !== room) {
    lanRooms.delete(room)
    lanRooms.set(finalName, roomState)
    for (const ws of roomState.clients) ws.__lanRoom = finalName
    if (lanBanned.has(room)) {
      lanBanned.set(finalName, lanBanned.get(room))
      lanBanned.delete(room)
    }
  }
  return { ok: true, name: finalName }
})

ipcMain.handle('lan:signLocalToken', async (event, args = {}) => {
  const jwt = require('jsonwebtoken')
  const { username } = args
  const { privateKey } = getJwtKeys()
  if (!privateKey) throw new Error('JWT_PRIVATE_KEY manquant dans secrets/jwt_private.pem')
  const token = jwt.sign(
    { sub: username, username },
    privateKey,
    { algorithm: 'RS256', expiresIn: '24h' }
  )
  return { token }
})

ipcMain.handle('lan:clientLeave', async () => {
  if (lanClientSocket) {
    try { lanClientSocket.close() } catch (_) {}
    lanClientSocket = null
  }
  lanClientRoom = null
  return { ok: true }
})

ipcMain.handle('lan:hostDeleteRoom', async (event, args = {}) => {
  const { room } = args
  if (room) lanRooms.delete(room)
  return { ok: true }
})

ipcMain.handle('lan:getLocalIP', async () => {
  const os = require('os')
  const interfaces = os.networkInterfaces()
  for (const ifaces of Object.values(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return { ip: iface.address }
      }
    }
  }
  return { ip: '127.0.0.1' }
})

ipcMain.handle('lan:hostGetRooms', async () => {
  const rooms = []
  for (const [roomName, roomState] of lanRooms.entries()) {
    const members = [...roomState.clients]
      .filter((c) => c.__lanUser)
      .map((c) => c.__lanUser.username)
    rooms.push({
      name: roomName,
      protected: Boolean(roomState.passwordHashHex),
      members,
    })
  }
  return { rooms }
})

ipcMain.handle('lan:discoverAndListRooms', async (event, args = {}) => {
  const net = require('net')
  const os = require('os')
  const wsLib = require('ws')
  const { port: searchPort = 5050, connectTimeoutMs = 300 } = args

  let localIP = '127.0.0.1'
  const interfaces = os.networkInterfaces()
  outer: for (const ifaces of Object.values(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address
        break outer
      }
    }
  }

  const [a, b, c] = localIP.split('.')
  const base = `${a}.${b}.${c}`

  function isPortOpen(host) {
    return new Promise((resolve) => {
      const socket = new net.Socket()
      socket.setTimeout(connectTimeoutMs)
      socket.once('connect', () => { socket.destroy(); resolve(true) })
      socket.once('timeout', () => { socket.destroy(); resolve(false) })
      socket.once('error', () => resolve(false))
      socket.connect(searchPort, host)
    })
  }

  function getRoomsFromHost(host) {
    return new Promise((resolve) => {
      let done = false
      const ws = new wsLib.WebSocket(`ws://${host}:${searchPort}`)
      const timer = setTimeout(() => {
        if (!done) { done = true; try { ws.terminate() } catch (_) {} resolve([]) }
      }, 2000)
      ws.once('open', () => ws.send(JSON.stringify({ type: 'list_rooms' })))
      ws.once('message', (data) => {
        if (done) return
        clearTimeout(timer)
        done = true
        try {
          const msg = JSON.parse(data.toString())
          ws.close()
          if (msg.type === 'list_rooms_ack') {
            resolve(msg.rooms.map((r) => ({ ...r, host, port: searchPort })))
          } else resolve([])
        } catch (_) { resolve([]) }
      })
      ws.once('error', () => {
        if (!done) { done = true; clearTimeout(timer); resolve([]) }
      })
    })
  }

  const hosts = Array.from({ length: 254 }, (_, i) => `${base}.${i + 1}`)
  const BATCH = 50
  const openHosts = []

  for (let i = 0; i < hosts.length; i += BATCH) {
    const batch = hosts.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map((h) => isPortOpen(h).then((open) => ({ h, open })))
    )
    openHosts.push(...results.filter((r) => r.open).map((r) => r.h))
  }

  const allRooms = (await Promise.all(openHosts.map((host) => getRoomsFromHost(host)))).flat()

  return { rooms: allRooms, localIP }
})

ipcMain.handle('app:getAutoStart', () => {
  return { enabled: app.getLoginItemSettings().openAtLogin }
})

ipcMain.handle('app:setAutoStart', (event, { enabled }) => {
  app.setLoginItemSettings({ openAtLogin: Boolean(enabled) })
  if (tray) {
    const buildMenu = () => Menu.buildFromTemplate([
      {
        label: 'Afficher CloseChat',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.show()
            mainWindow.focus()
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Démarrage automatique',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => {
          app.setLoginItemSettings({ openAtLogin: item.checked })
          tray.setContextMenu(buildMenu())
        },
      },
      { type: 'separator' },
      { label: 'Quitter', click: () => { isQuitting = true; app.quit() } },
    ])
    tray.setContextMenu(buildMenu())
  }
  return { enabled: Boolean(enabled) }
})

ipcMain.handle('app:saveFile', async (event, { defaultName, content }) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exporter la conversation',
    defaultPath: defaultName || 'conversation.txt',
    filters: [
      { name: 'Fichier texte', extensions: ['txt'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  })
  if (canceled || !filePath) return { ok: false }
  const fs = require('fs')
  fs.writeFileSync(filePath, content, 'utf8')
  return { ok: true, filePath }
})

ipcMain.handle('app:openFile', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Ouvrir un fichier',
    properties: ['openFile'],
    filters: [
      { name: 'Fichier texte', extensions: ['txt'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  })
  if (canceled || filePaths.length === 0) return { ok: false }
  const fs = require('fs')
  const content = fs.readFileSync(filePaths[0], 'utf8')
  return { ok: true, filePath: filePaths[0], content }
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

