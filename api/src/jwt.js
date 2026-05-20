const fs = require('fs')
const path = require('path')
const { generateKeyPairSync } = require('crypto')
const jwt = require('jsonwebtoken')

// JWT_SECRETS_DIR (env) > chemin calculé relatif à ce fichier (<repo>/secrets en dev, /app/secrets en Docker)
const secretsDir = process.env.JWT_SECRETS_DIR || path.join(__dirname, '..', '..', 'secrets')
const PRIVATE_PATH = path.join(secretsDir, 'jwt_private.pem')
const PUBLIC_PATH = path.join(secretsDir, 'jwt_public.pem')

function readIfFileExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, 'utf8')
  } catch (_) {
    return null
  }
}

function ensureKeysOnDisk() {
  if (fs.existsSync(PRIVATE_PATH) && fs.existsSync(PUBLIC_PATH)) return
  fs.mkdirSync(secretsDir, { recursive: true })
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  fs.writeFileSync(PRIVATE_PATH, privateKey, 'utf8')
  fs.writeFileSync(PUBLIC_PATH, publicKey, 'utf8')
  // eslint-disable-next-line no-console
  console.log('JWT : clés RSA générées automatiquement dans secrets/')
}

function getSigningKeys() {
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
    return {
      privateKey: process.env.JWT_PRIVATE_KEY,
      publicKey: process.env.JWT_PUBLIC_KEY,
    }
  }

  // Fallback : lire les clés persistantes depuis `secrets/`.
  // Cette approche facilite le mode multi-machines (copier seulement jwt_public.pem).
  ensureKeysOnDisk()
  return {
    privateKey: readIfFileExists(PRIVATE_PATH),
    publicKey: readIfFileExists(PUBLIC_PATH),
  }
}

function signAccessToken({ userId, username }) {
  const { privateKey } = getSigningKeys()
  return jwt.sign(
    {
      sub: userId,
      username,
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: '7d',
    },
  )
}

function verifyAccessToken(token) {
  const { publicKey } = getSigningKeys()
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] })
}

function getBearerToken(req) {
  const header = req.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

function optionalAuth(req, res, next) {
  const token = getBearerToken(req)
  if (!token) return next()
  try {
    const payload = verifyAccessToken(token)
    req.auth = {
      userId: payload.sub,
      username: payload.username,
    }
  } catch (_) {
    // Token invalide => on laisse passer sans auth (routes peuvent gérer).
    req.auth = null
  }
  return next()
}

function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.auth) return res.status(401).json({ error: 'Unauthorized' })
    return next()
  })
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  optionalAuth,
  requireAuth,
}

