const { app, BrowserWindow } = require('electron')
const path = require('path')

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

function createWindow({ devUrl, isDev }) {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    webPreferences: {
      // Pas de preload pour ce scaffold initial
      nodeIntegration: false,
      contextIsolation: true,
    },
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

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

