const express = require('express')
const { pool } = require('./db')
const { requireAuth, optionalAuth } = require('./jwt')

const router = express.Router()

// GET /profile/me — propre profil
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT username, avatar_emoji, status, bio FROM users WHERE username = $1 OR id::text = $1 LIMIT 1',
      [req.auth.username || req.auth.userId],
    )
    const user = result.rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json({ profile: user })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed' })
  }
})

// GET /profile/:username — profil public
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT username, avatar_emoji, status, bio FROM users WHERE username = $1 LIMIT 1',
      [req.params.username],
    )
    const profile = result.rows[0] || {
      username: req.params.username,
      avatar_emoji: '😊',
      status: 'available',
      bio: '',
    }
    return res.json({ profile })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed' })
  }
})

// PUT /profile — mettre à jour son profil (avatar, statut, bio)
router.put('/', requireAuth, async (req, res) => {
  try {
    const { avatarEmoji, status, bio } = req.body
    const validStatuses = ['available', 'busy', 'dnd']
    const safeStatus = validStatuses.includes(status) ? status : 'available'
    const safeEmoji = String(avatarEmoji || '😊').slice(0, 4)
    const safeBio = String(bio || '').slice(0, 100)

    await pool.query(
      `UPDATE users SET avatar_emoji = $1, status = $2, bio = $3, updated_at = now()
       WHERE username = $4 OR id::text = $4`,
      [safeEmoji, safeStatus, safeBio, req.auth.username || req.auth.userId],
    )
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed' })
  }
})

// DELETE /profile — réinitialiser son profil aux valeurs par défaut
router.delete('/', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE users SET avatar_emoji = '😊', status = 'available', bio = '', updated_at = now()
       WHERE username = $1 OR id::text = $1`,
      [req.auth.username || req.auth.userId],
    )
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed' })
  }
})

module.exports = router
