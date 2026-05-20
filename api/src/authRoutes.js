const express = require('express')
const bcrypt = require('bcryptjs')
const { pool } = require('./db')
const { signAccessToken, requireAuth } = require('./jwt')

const router = express.Router()

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const rawId = String(req.body?.identifier || req.body?.email || req.body?.pseudo || '').trim()
    const password = String(req.body?.password || '')

    if (!rawId || !password) {
      return res.status(400).json({ error: 'identifier and password are required' })
    }

    const isEmail = rawId.includes('@')
    const emailValue = isEmail ? rawId.toLowerCase() : null
    const usernameValue = isEmail ? null : rawId

    const existing = await pool.query(
      'SELECT id FROM users WHERE lower(email) = lower($1) OR lower(username) = lower($1) LIMIT 1',
      [rawId],
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Account already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const insert = await pool.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
      [emailValue, usernameValue, passwordHash],
    )

    const user = insert.rows[0]
    const token = signAccessToken({ userId: user.id, username: user.username || user.email })
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, username: user.username, createdAt: user.created_at },
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Signup failed' })
  }
})

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const rawId = String(req.body?.identifier || req.body?.email || req.body?.pseudo || '').trim()
    const password = String(req.body?.password || '')

    if (!rawId || !password) {
      return res.status(400).json({ error: 'identifier and password are required' })
    }

    const lookup = await pool.query(
      'SELECT id, email, username, password_hash FROM users WHERE lower(email) = lower($1) OR lower(username) = lower($1) LIMIT 1',
      [rawId],
    )
    if (lookup.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = lookup.rows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signAccessToken({ userId: user.id, username: user.username || user.email })
    return res.json({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Login failed' })
  }
})

// PUT /auth/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username, email } = req.body
    const id = req.auth.userId || req.auth.username
    if (username?.trim()) {
      await pool.query(
        'UPDATE users SET username=$1, updated_at=now() WHERE id::text = $2 OR username = $2',
        [username.trim(), id],
      )
    }
    if (email !== undefined) {
      await pool.query(
        'UPDATE users SET email=$1, updated_at=now() WHERE id::text = $2 OR username = $2',
        [email.trim() || null, id],
      )
    }
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Update failed' })
  }
})

// PUT /auth/password
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const id = req.auth.userId || req.auth.username
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' })
    }
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id::text = $1 OR username = $1 LIMIT 1',
      [id],
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!valid) return res.status(401).json({ error: 'Wrong current password' })
    const hash = await bcrypt.hash(newPassword, 12)
    await pool.query(
      'UPDATE users SET password_hash=$1, updated_at=now() WHERE id::text = $2 OR username = $2',
      [hash, id],
    )
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Password update failed' })
  }
})

module.exports = router
