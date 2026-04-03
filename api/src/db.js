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

  // Exécute le schéma minimal (idempotent)
  await pool.query(sql)
}

async function closePool() {
  await pool.end()
}

module.exports = {
  pool,
  initDb,
  closePool,
}

