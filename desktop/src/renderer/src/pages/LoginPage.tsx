import { useState } from 'react'
import { getLocalProfile, saveLocalProfile, markPersisted } from '../profileStorage'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import type { NavigateFn } from './HomePage'

const API = 'http://localhost:6767'
const SYNC_TIMEOUT_MS = 1000

async function syncProfileOnLogin(username: string, token: string): Promise<void> {
  const cached = getLocalProfile(username)

  const withTimeout = (p: Promise<unknown>) =>
    Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), SYNC_TIMEOUT_MS))])

  if (!cached.isPersisted) {
    // Des modifs locales attendent d'être persistées → on les envoie
    try {
      const res = await withTimeout(fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarEmoji: cached.avatar_emoji, status: cached.status, bio: cached.bio }),
      })) as Response
      if (res.ok) markPersisted(username)
    } catch (_) {}
  } else {
    // localStorage est à jour → on tire le profil depuis l'API pour écraser d'éventuelles valeurs périmées
    try {
      const res = await withTimeout(fetch(`${API}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })) as Response
      if (!res.ok) return
      const data = await res.json()
      if (!data?.profile) return
      const p = data.profile
      saveLocalProfile(username, { avatar_emoji: p.avatar_emoji || '😊', status: p.status || 'available', bio: p.bio || '' }, true)
    } catch (_) {}
  }
}

type Props = {
  navigate: NavigateFn
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 42,
    backgroundColor: '#ffffff',
    fontFamily: '"Caveat", system-ui, sans-serif',
    fontSize: 22,
    borderRadius: '10px',
    '& fieldset': { borderColor: '#d1d5db', borderWidth: '1px' },
    '&:hover fieldset': { borderColor: '#b25a33' },
    '&.Mui-focused fieldset': { borderColor: '#b25a33' },
  },
  '& .MuiOutlinedInput-input': { px: 1.4, py: 0 },
}

export default function LoginPage({ navigate }: Props) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    const id = identifier.trim()
    if (!id) { setError('Entrez votre pseudo ou e-mail.'); return }
    setLoading(true)
    setError('')

    try {
      // Tentative via l'API (si disponible)
      const res = await fetch('http://localhost:6767/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const username = data.user?.username ?? id
        const token = data.token
        // Sync du profil avant de naviguer (timeout 1s pour ne pas bloquer)
        await syncProfileOnLogin(username, token)
        navigate('discover', { username, token })
        return
      }
      // L'API a répondu mais les identifiants sont incorrects → on n'utilise pas le fallback
      setError(data.error || 'Identifiants incorrects.')
      setLoading(false)
      return
    } catch (_) {
      // Vraie erreur réseau : API unreachable → token local
    }

    try {
      const { token } = await window.closechatLan.signLocalToken({ username: id })
      navigate('discover', { username: id, token })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de générer un token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        height: '100dvh',
        boxSizing: 'border-box',
        bgcolor: '#fdf7f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        py: { xs: 2, md: 4 },
        backgroundImage:
          'radial-gradient(circle at left bottom, rgba(218,233,221,0.92), transparent 55%), radial-gradient(circle at right top, rgba(242,223,215,0.88), transparent 60%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <Stack
        spacing={2}
        sx={{
          width: '100%',
          maxWidth: 520,
          alignItems: 'center',
          bgcolor: 'rgba(255,255,255,0.82)',
          borderRadius: 4,
          border: '1px solid rgba(229, 231, 235, 0.9)',
          boxShadow: '0 14px 30px rgba(17, 24, 39, 0.12)',
          px: { xs: 3, md: 5 },
          py: { xs: 3, md: 4.5 },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Box component="img" src="/icon.png" alt="CloseChat" sx={{ width: 72, height: 72, borderRadius: 3, mb: 0.5 }} />
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 30, color: '#374151', lineHeight: 1.2 }}>
            Bienvenue sur
          </Typography>
          <Typography
            component="h1"
            sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: { xs: 56, sm: 64 }, color: '#1f2933', lineHeight: 1.1, mb: 0.5 }}
          >
            CloseChat
          </Typography>
        </Box>

        <Stack spacing={0.6} sx={{ width: '100%' }}>
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 24, color: '#374151', pl: 0.5 }}>
            Pseudo ou mail :
          </Typography>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            inputProps={{ 'aria-label': 'Pseudo ou mail' }}
            sx={fieldSx}
          />
        </Stack>

        <Stack spacing={0.6} sx={{ width: '100%' }}>
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 24, color: '#374151', pl: 0.5 }}>
            Mot de passe :
          </Typography>
          <TextField
            size="small"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            inputProps={{ 'aria-label': 'Mot de passe' }}
            sx={fieldSx}
          />
        </Stack>

        {error && (
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#b91c1c' }}>
            {error}
          </Typography>
        )}

        <Stack direction="row" spacing={1.5} sx={{ pt: 0.8 }}>
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleLogin}
            sx={{
              py: 0.8,
              px: 3.2,
              borderRadius: 2.5,
              backgroundColor: '#b25a33',
              boxShadow: '0 8px 18px rgba(148, 64, 28, 0.32)',
              color: '#fffdfc',
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: 25,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#a24f2c', boxShadow: '0 6px 14px rgba(148, 64, 28, 0.38)' },
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('signup')}
            sx={{
              py: 0.8,
              px: 3.2,
              borderRadius: 2.5,
              borderColor: '#d1d5db',
              color: '#374151',
              backgroundColor: '#ffffff',
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: 25,
              textTransform: 'none',
              '&:hover': { borderColor: '#b8bec7', backgroundColor: '#f9fafb' },
            }}
          >
            S&apos;inscrire
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
