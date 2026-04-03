async function cleanupOldCrashReports(pool) {
  await pool.query(
    "DELETE FROM crash_reports WHERE created_at < (now() - interval '6 months')",
  )
}

function startCrashCleanupJob(pool) {
  const run = async () => {
    try {
      await cleanupOldCrashReports(pool)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[api] crash cleanup failed:', err?.message || err)
    }
  }

  // Démarre tout de suite pour valider le pipeline.
  run()

  // Puis toutes les 24h.
  setInterval(run, 24 * 60 * 60 * 1000)
}

module.exports = { startCrashCleanupJob }

