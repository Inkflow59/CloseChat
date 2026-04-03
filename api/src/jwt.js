const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')

function readIfFileExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, 'utf8')
  } catch (_) {
    return null
  }
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
  // __dirname = <repo>/api/src => remonter jusqu'à <repo>/
  const repoRoot = path.join(__dirname, '..', '..', '..')
  const privateFromDisk = readIfFileExists(path.join(repoRoot, 'secrets', 'jwt_private.pem'))
  const publicFromDisk = readIfFileExists(path.join(repoRoot, 'secrets', 'jwt_public.pem'))

  if (privateFromDisk && publicFromDisk) {
    return { privateKey: privateFromDisk, publicKey: publicFromDisk }
  }

  throw new Error(
    'JWT keys manquantes : définis JWT_PRIVATE_KEY/JWT_PUBLIC_KEY ou crée secrets/jwt_private.pem & secrets/jwt_public.pem',
  )
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

