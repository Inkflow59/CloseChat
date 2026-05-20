const express = require('express')
const multer = require('multer')
const { pool } = require('./db')
const { verifyAccessToken } = require('./jwt')

const router = express.Router()

// crashReporter envoie (souvent) du multipart.
// On capture tout en mémoire puis on ne stocke que les métadonnées + raw json.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max par fichier
  },
})

function getUserIdFromAuthHeader(req) {
  const header = req.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null

  const payload = verifyAccessToken(token)
  return payload?.sub || null
}

router.post('/crash', upload.any(), async (req, res) => {
  try {
    // Supporte JSON (envois depuis le process main/renderer) et multipart (Crashpad natif).
    const body = req.body || {}

    const maybeUserId = (() => {
      try {
        return getUserIdFromAuthHeader(req)
      } catch (_) {
        return null
      }
    })()

    const exception =
      body.exception || body.exception_string || body.stack || body.reason || null

    const stack = body.stack || body.stack_trace || null

    const crashId = body.crash_id || body.crashId || body.upload_file_identifier || null

    const raw = {
      body,
      files: (req.files || []).map((f) => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      })),
    }

    await pool.query(
      `INSERT INTO crash_reports (user_id, app_version, platform, exception, stack, crash_id, raw)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        maybeUserId,
        body.appVersion || body.app_version || null,
        body.platform || null,
        exception,
        stack,
        crashId,
        raw,
      ],
    )

    return res.status(204).send()
  } catch (err) {
    // Retourne 200/204 de toute façon si tu veux éviter les boucles de retry
    // lors de crashes en cascade.
    return res.status(500).json({ error: err?.message || 'Crash ingest failed' })
  }
})

module.exports = router

