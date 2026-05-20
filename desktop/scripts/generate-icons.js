const sharp = require('sharp')
const pngToIco = require('png-to-ico').default
const path = require('path')
const fs = require('fs')

const SRC = path.join(__dirname, '..', 'resources', 'icon.svg')
const OUT = path.join(__dirname, '..', 'resources')

const sizes = [
  { name: 'icon-16.png',  size: 16  },
  { name: 'icon-32.png',  size: 32  },
  { name: 'icon-64.png',  size: 64  },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-256.png', size: 256 },
  { name: 'icon.png',     size: 256 }, // installeur electron-builder (Linux/Mac)
  { name: 'tray.png',     size: 16  }, // tray Windows
  { name: 'tray@2x.png', size: 32  }, // tray HiDPI
]

async function run() {
  const svg = fs.readFileSync(SRC)

  for (const { name, size } of sizes) {
    await sharp(svg).resize(size, size).png().toFile(path.join(OUT, name))
    console.log(`✓ ${name} (${size}×${size})`)
  }

  // Génère icon.ico (16, 32, 64, 128, 256) pour Windows
  const icoPaths = [16, 32, 64, 128, 256].map((s) => path.join(OUT, `icon-${s}.png`))
  const icoBuffer = await pngToIco(icoPaths)
  fs.writeFileSync(path.join(OUT, 'icon.ico'), icoBuffer)
  console.log('✓ icon.ico (16/32/64/128/256)')

  console.log('\nIcônes générées dans desktop/resources/')
}

run().catch((err) => {
  console.error('Erreur :', err.message)
  process.exit(1)
})
