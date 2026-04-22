const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Pour un dev local avec certificats auto-signés éventuels.
  ssl: process.env.DATABASE_URL?.startsWith('postgres://')
    ? undefined
    : { rejectUnauthorized: false },
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function isTransientDbError(error) {
  return [
    'EAI_AGAIN',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    '57P03', // cannot_connect_now (Postgres starting up)
  ].includes(error?.code)
}

async function initDb() {
  if (!process.env.DATABASE_URL) {
    // Permet de démarrer l’API même si Postgres n’est pas configuré.
    // (Les routes auth/crash échoueront ensuite.)
    // eslint-disable-next-line no-console
    console.warn('[api] DATABASE_URL manquant : initDb() ignoré.')
    return
  }

  // __dirname = <repo>/api/src => remonter jusqu'à <repo>/
  const repoRoot = path.join(__dirname, '..', '..', '..')
  const dbSqlPath = path.join(repoRoot, 'db', 'db.sql')
  const sql = fs.readFileSync(dbSqlPath, 'utf8')

  // Exécute le schéma minimal (idempotent) avec retries:
  // au démarrage Docker, DNS/réseau/Postgres peuvent être momentanément indisponibles.
  const maxAttempts = Number(process.env.DB_INIT_MAX_ATTEMPTS || 12)
  const retryDelayMs = Number(process.env.DB_INIT_RETRY_DELAY_MS || 2000)

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query(sql)
      return
    } catch (error) {
      if (!isTransientDbError(error) || attempt === maxAttempts) {
        throw error
      }

      // eslint-disable-next-line no-console
      console.warn(
        `[api] initDb attempt ${attempt}/${maxAttempts} failed (${error.code}), retrying in ${retryDelayMs}ms...`
      )
      await sleep(retryDelayMs)
    }
  }
}

async function closePool() {
  await pool.end()
}

module.exports = {
  pool,
  initDb,
  closePool,
}

