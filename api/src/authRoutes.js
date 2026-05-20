const express = require('express')
const bcrypt = require('bcryptjs')
const { pool } = require('./db')
const { signAccessToken, requireAuth } = require('./jwt')

function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase()
}

const router = express.Router()

// POST /auth/signup
// Body: { identifier: string (email ou pseudo), password: string }
router.post('/signup', async (req, res) => {
  try {
    const identifier =
      normalizeIdentifier(req.body?.identifier || req.body?.email || req.body?.pseudo)
    const password = String(req.body?.password || '')

    if (!identifier || !password) {
      return res.status(400).json({ error: 'identifier and password are required' })
    }

    // Petit heuristique : si l’utilisateur ressemble à un email => email, sinon pseudo.
    const isEmail = identifier.includes('@')

    const client = pool
    const existing = await client.query(
      'SELECT id, email, username FROM users WHERE email = $1 OR username = $1 LIMIT 1',
      [identifier],
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Account already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const emailValue = isEmail ? identifier : null
    const usernameValue = isEmail ? null : identifier

    const insert = await client.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [emailValue, usernameValue, passwordHash],
    )

    const user = insert.rows[0]
    const token = signAccessToken({
      userId: user.id,
      username: user.username || user.email,
    })

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Signup failed' })
  }
})

// POST /auth/login
// Body: { identifier: string (email ou pseudo), password: string }
router.post('/login', async (req, res) => {
  try {
    const identifier = normalizeIdentifier(req.body?.identifier || req.body?.email || req.body?.pseudo)
    const password = String(req.body?.password || '')

    if (!identifier || !password) {
      return res.status(400).json({ error: 'identifier and password are required' })
    }

    const lookup = await pool.query(
      'SELECT id, email, username, password_hash FROM users WHERE email = $1 OR username = $1 LIMIT 1',
      [identifier],
    )

    if (lookup.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = lookup.rows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signAccessToken({
      userId: user.id,
      username: user.username || user.email,
    })

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Login failed' })
  }
})

// PUT /auth/profile — change pseudo et/ou email
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username, email } = req.body
    const userId = req.auth.userId
    if (username?.trim()) {
      await pool.query('UPDATE users SET username=$1, updated_at=now() WHERE id=$2', [username.trim(), userId])
    }
    if (email !== undefined) {
      await pool.query('UPDATE users SET email=$1, updated_at=now() WHERE id=$2', [email.trim() || null, userId])
    }
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Update failed' })
  }
})

// PUT /auth/password — change le mot de passe
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.auth.userId
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword et newPassword sont requis.' })
    }
    const result = await pool.query('SELECT password_hash FROM users WHERE id=$1', [userId])
    if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' })
    const hash = await bcrypt.hash(newPassword, 12)
    await pool.query('UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2', [hash, userId])
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Password update failed' })
  }
})

module.exports = router

