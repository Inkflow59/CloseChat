import { useState } from 'react'
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material'
import type { Room } from '../vite-env'

type Props = {
  username: string
  localIP: string
  room: Room
  token: string
  onClose: () => void
  onUsernameChange: (newUsername: string, newToken: string) => void
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 48,
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

const labelSx = {
  fontFamily: '"Caveat", system-ui, sans-serif',
  fontSize: 20,
  color: '#374151',
  pl: 0.5,
}

export default function AccountPanel({ username, localIP, room, token, onClose, onUsernameChange }: Props) {
  const [newPseudo, setNewPseudo] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleUpdate() {
    setError('')
    setSuccess('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if ((newPassword || confirmPassword) && !currentPassword) {
      setError('Le mot de passe actuel est requis pour le changer.')
      return
    }

    setSaving(true)
    try {
      // 1. Changement de pseudo (temps réel via WS + nouveau token local)
      const finalUsername = newPseudo.trim() || username
      if (newPseudo.trim() && newPseudo.trim() !== username) {
        await window.closechatLan.clientRename({
          newUsername: newPseudo.trim(),
          room: room.name,
          token,
        })
        const { token: newToken } = await window.closechatLan.signLocalToken({ username: newPseudo.trim() })
        onUsernameChange(newPseudo.trim(), newToken)
      }

      // 2. Mise à jour profil via API (pseudo + email)
      if (newPseudo.trim() || newEmail.trim()) {
        try {
          await fetch('http://localhost:6767/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              ...(newPseudo.trim() ? { username: newPseudo.trim() } : {}),
              ...(newEmail.trim() ? { email: newEmail.trim() } : {}),
            }),
          })
        } catch (_) { /* API indisponible, mise à jour locale seulement */ }
      }

      // 3. Changement de mot de passe via API
      if (newPassword && currentPassword) {
        const res = await fetch('http://localhost:6767/auth/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword, newPassword }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Erreur lors du changement de mot de passe.')
          setSaving(false)
          return
        }
      }

      setSuccess('Modifications enregistrées !')
      setNewPseudo('')
      setNewEmail('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        const pseudoChanged = newPseudo.trim() && newPseudo.trim() !== username
        if (!pseudoChanged) onClose()
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        bgcolor: '#fdf7f2',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage:
          'radial-gradient(circle at left bottom, rgba(218,233,221,0.92), transparent 55%), radial-gradient(circle at right top, rgba(242,223,215,0.88), transparent 60%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      {/* Header orange */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          backgroundColor: '#b25a33',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            onClick={onClose}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#ffffff' } }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Box>
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 26, color: '#ffffff' }}>
            CloseChat
          </Typography>
        </Box>
        <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 20, color: 'rgba(255,255,255,0.85)' }}>
          {localIP || '…'}
        </Typography>
      </Box>

      {/* Contenu scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', px: 4, py: 4 }}>
        <Box sx={{ width: '100%', maxWidth: 600 }}>

          {/* Titre + avatar */}
          <Typography
            sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: { xs: 26, sm: 32 }, color: '#374151', textAlign: 'center', mb: 2.5 }}
          >
            Vous voyez ? Et bien, c'est vous
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: '2.5px solid #1f2933',
                mb: 1.5,
              }}
            />
            <Typography
              sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 30, color: '#1f2933' }}
            >
              {username}
            </Typography>
          </Box>

          {/* Section profil */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Changer le pseudo</Typography>
              <TextField
                size="small"
                fullWidth
                variant="outlined"
                value={newPseudo}
                onChange={(e) => setNewPseudo(e.target.value)}
                placeholder={username}
                sx={fieldSx}
              />
            </Stack>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Changer l'email</Typography>
              <TextField
                size="small"
                fullWidth
                variant="outlined"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                sx={fieldSx}
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* Section mot de passe */}
          <Typography
            sx={{
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: 20,
              color: '#6b7280',
              textAlign: 'center',
              my: 2.5,
            }}
          >
            Attention, zone sensible. Vous êtes sûr de vouloir faire ça ?
          </Typography>

          <Stack spacing={2} sx={{ mb: 3 }}>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Mot de passe actuel</Typography>
              <TextField
                size="small"
                type="password"
                fullWidth
                variant="outlined"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                sx={fieldSx}
              />
            </Stack>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Nouveau mot de passe</Typography>
              <TextField
                size="small"
                type="password"
                fullWidth
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={fieldSx}
              />
            </Stack>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Confirmer mot de passe</Typography>
              <TextField
                size="small"
                type="password"
                fullWidth
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                sx={fieldSx}
              />
            </Stack>
          </Stack>

          {error && (
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#b91c1c', textAlign: 'center', mb: 1.5 }}>
              {error}
            </Typography>
          )}
          {success && (
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#15803d', textAlign: 'center', mb: 1.5 }}>
              {success}
            </Typography>
          )}

          {/* Bouton */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Button
              variant="outlined"
              disabled={saving}
              onClick={handleUpdate}
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                textTransform: 'none',
                fontSize: 26,
                px: 7,
                py: 1.2,
                borderRadius: 3,
                borderColor: '#1f2933',
                borderWidth: '2px',
                color: '#1f2933',
                backgroundColor: '#ffffff',
                '&:hover': { backgroundColor: '#f9fafb', borderColor: '#374151', borderWidth: '2px' },
                '&.Mui-disabled': { borderWidth: '2px', borderColor: '#d1d5db', color: '#9ca3af' },
              }}
            >
              {saving ? 'Mise à jour…' : 'Mettre à jour'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
