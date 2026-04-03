const fs = require('fs')
const path = require('path')
const { generateKeyPairSync } = require('crypto')

const repoRoot = path.join(__dirname, '..')
const secretsDir = path.join(repoRoot, 'secrets')

fs.mkdirSync(secretsDir, { recursive: true })

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const privatePath = path.join(secretsDir, 'jwt_private.pem')
const publicPath = path.join(secretsDir, 'jwt_public.pem')

fs.writeFileSync(privatePath, privateKey, 'utf8')
fs.writeFileSync(publicPath, publicKey, 'utf8')

console.log('JWT clés générées avec succès.')
console.log(`Private key: ${privatePath}`)
console.log(`Public key : ${publicPath}`)
console.log('')
console.log('Astuce multi-machines : copier secrets/jwt_public.pem sur chaque machine qui doit vérifier les tokens (LAN).')

