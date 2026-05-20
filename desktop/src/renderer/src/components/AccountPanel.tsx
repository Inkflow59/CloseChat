import { useState, useEffect } from 'react'
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material'
import type { Room, Profile } from '../vite-env'

const API = 'http://localhost:6767'

const PRESET_EMOJIS = ['😊', '😎', '🤔', '🔥', '⚡', '🎮', '🎵', '🌟', '🦊', '🐱', '🦁', '🚀', '💻', '🌈', '🍕']
const STATUSES = [
  { value: 'available', label: 'Disponible',       color: '#22c55e' },
  { value: 'busy',      label: 'Occupé',            color: '#f59e0b' },
  { value: 'dnd',       label: 'Ne pas déranger',   color: '#ef4444' },
] as const

type Props = {
  username: string
  localIP: string
  room: Room
  token: string
  onClose: () => void
  onUsernameChange: (newUsername: string, newToken: string) => void
  onProfileSaved: (profile: Profile) => void
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

function profileKey(u: string) { return `closechat:profile:${u}` }

function loadLocalProfile(u: string): Partial<Profile> {
  try {
    const raw = localStorage.getItem(profileKey(u))
    return raw ? JSON.parse(raw) : {}
  } catch (_) { return {} }
}

function saveLocalProfile(u: string, p: { avatar_emoji: string; status: string; bio: string }) {
  try { localStorage.setItem(profileKey(u), JSON.stringify(p)) } catch (_) {}
}

export default function AccountPanel({ username, localIP, room, token, onClose, onUsernameChange, onProfileSaved }: Props) {
  const [avatar, setAvatar]   = useState('😊')
  const [status, setStatus]   = useState<'available' | 'busy' | 'dnd'>('available')
  const [bio, setBio]         = useState('')
  const [newPseudo, setNewPseudo]             = useState('')
  const [newEmail, setNewEmail]               = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const local = loadLocalProfile(username)
    const isDefault = local.avatar_emoji === '😊' && !local.bio && local.status === 'available'

    setAvatar(local.avatar_emoji || '😊')
    setStatus((local.status || 'available') as 'available' | 'busy' | 'dnd')
    setBio(local.bio || '')

    // Charger depuis l'API uniquement si localStorage ne contient rien de personnalisé
    // (évite d'écraser un profil local avec des valeurs par défaut de la BDD)
    if (isDefault) {
      fetch(`${API}/profile/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data?.profile) return
          const p = data.profile
          const apiIsDefault = p.avatar_emoji === '😊' && !p.bio && p.status === 'available'
          if (apiIsDefault) return
          setAvatar(p.avatar_emoji || '😊')
          setStatus((p.status || 'available') as 'available' | 'busy' | 'dnd')
          setBio(p.bio || '')
          saveLocalProfile(username, { avatar_emoji: p.avatar_emoji, status: p.status, bio: p.bio })
        })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      // 1. Sauvegarder le profil en local (toujours)
      const profileData = { avatar_emoji: avatar, status, bio }
      saveLocalProfile(username, profileData)
      onProfileSaved({ username, ...profileData })

      // Broadcaster la mise à jour aux autres membres du salon (temps réel)
      window.closechatLan.clientProfileUpdate({ room: room.name, token, profile: profileData }).catch(() => {})

      // 2. Tenter la sauvegarde API (best-effort)
      try {
        const res = await fetch(`${API}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatarEmoji: avatar, status, bio }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          console.warn('Profile API error:', data.error)
        }
      } catch (_) { /* API indisponible, localStorage suffit */ }

      // 3. Changement de pseudo
      if (newPseudo.trim() && newPseudo.trim() !== username) {
        await window.closechatLan.clientRename({ newUsername: newPseudo.trim(), room: room.name, token })
        const { token: newToken } = await window.closechatLan.signLocalToken({ username: newPseudo.trim() })
        saveLocalProfile(newPseudo.trim(), profileData)
        try {
          await fetch(`${API}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` },
            body: JSON.stringify({ avatarEmoji: avatar, status, bio }),
          })
        } catch (_) {}
        onUsernameChange(newPseudo.trim(), newToken)
      }

      // 4. Mise à jour email
      if (newEmail.trim()) {
        try {
          await fetch(`${API}/auth/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email: newEmail.trim() }),
          })
        } catch (_) {}
      }

      // 5. Changement de mot de passe
      if (newPassword && currentPassword) {
        const res = await fetch(`${API}/auth/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword, newPassword }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Mot de passe actuel incorrect.')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  const selectedStatusColor = STATUSES.find((s) => s.value === status)?.color || '#22c55e'

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 500, bgcolor: '#fdf7f2', display: 'flex', flexDirection: 'column', backgroundImage: 'radial-gradient(circle at left bottom, rgba(218,233,221,0.92), transparent 55%), radial-gradient(circle at right top, rgba(242,223,215,0.88), transparent 60%)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, backgroundColor: '#b25a33', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box onClick={onClose} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#ffffff' } }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Box>
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 26, color: '#ffffff' }}>CloseChat</Typography>
        </Box>
        <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 20, color: 'rgba(255,255,255,0.85)' }}>{localIP || '…'}</Typography>
      </Box>

      {/* Contenu scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 3 }}>
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>

          {/* Avatar + pseudo */}
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: { xs: 24, sm: 30 }, color: '#374151', textAlign: 'center', mb: 2.5 }}>
            Vous voyez ? Et bien, c'est vous
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', mb: 1.5 }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', border: '2.5px solid #1f2933', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                {avatar}
              </Box>
              <Box sx={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', bgcolor: selectedStatusColor, border: '2px solid #ffffff' }} />
            </Box>
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 28, color: '#1f2933' }}>{username}</Typography>
          </Box>

          {/* Profil */}
          <Stack spacing={2.5} sx={{ mb: 2 }}>
            <Stack spacing={0.8}>
              <Typography sx={labelSx}>Avatar</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                {PRESET_EMOJIS.map((e) => (
                  <Box key={e} onClick={() => setAvatar(e)} sx={{ width: 38, height: 38, borderRadius: 2, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid', borderColor: avatar === e ? '#b25a33' : 'transparent', bgcolor: avatar === e ? '#fdf0e8' : '#f9fafb', transition: 'all 0.1s', '&:hover': { borderColor: '#b25a33' } }}>
                    {e}
                  </Box>
                ))}
              </Box>
              <TextField size="small" variant="outlined" value={avatar} onChange={(e) => setAvatar(e.target.value.slice(0, 4) || '😊')} placeholder="Ou tapez votre emoji…" sx={{ ...fieldSx, maxWidth: 220 }} />
            </Stack>

            <Stack spacing={0.8}>
              <Typography sx={labelSx}>Statut</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {STATUSES.map((s) => (
                  <Box key={s.value} onClick={() => setStatus(s.value)} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.8, borderRadius: 2, cursor: 'pointer', border: '2px solid', transition: 'all 0.12s', borderColor: status === s.value ? s.color : '#e5e7eb', bgcolor: status === s.value ? `${s.color}18` : '#ffffff' }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                    <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#374151' }}>{s.label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>

            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Bio <Box component="span" sx={{ color: '#9ca3af', fontSize: 16 }}>({bio.length}/100)</Box></Typography>
              <TextField size="small" fullWidth multiline rows={2} variant="outlined" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 100))} placeholder="En deux mots, qui êtes-vous ?" sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#ffffff', fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 20, borderRadius: '10px', '& fieldset': { borderColor: '#d1d5db' }, '&:hover fieldset': { borderColor: '#b25a33' }, '&.Mui-focused fieldset': { borderColor: '#b25a33' } } }} />
            </Stack>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          {/* Compte */}
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Changer le pseudo</Typography>
              <TextField size="small" fullWidth variant="outlined" value={newPseudo} onChange={(e) => setNewPseudo(e.target.value)} placeholder={username} sx={fieldSx} />
            </Stack>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Changer l'email</Typography>
              <TextField size="small" fullWidth variant="outlined" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} sx={fieldSx} />
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 20, color: '#6b7280', textAlign: 'center', my: 2 }}>
            Attention, zone sensible. Vous êtes sûr de vouloir faire ça ?
          </Typography>

          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Mot de passe actuel</Typography>
              <TextField size="small" type="password" fullWidth variant="outlined" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} sx={fieldSx} />
            </Stack>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Nouveau mot de passe</Typography>
              <TextField size="small" type="password" fullWidth variant="outlined" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} sx={fieldSx} />
            </Stack>
            <Stack spacing={0.5}>
              <Typography sx={labelSx}>Confirmer mot de passe</Typography>
              <TextField size="small" type="password" fullWidth variant="outlined" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdate()} sx={fieldSx} />
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Footer fixe avec le bouton */}
      <Box sx={{ flexShrink: 0, borderTop: '1px solid rgba(229,231,235,0.9)', bgcolor: 'rgba(255,255,255,0.9)', px: 4, py: 2 }}>
        {error && <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#b91c1c', textAlign: 'center', mb: 1.5 }}>{error}</Typography>}
        {success && <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#15803d', textAlign: 'center', mb: 1.5 }}>{success}</Typography>}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            disabled={saving}
            onClick={handleUpdate}
            sx={{
              fontFamily: '"Caveat", system-ui, sans-serif',
              textTransform: 'none',
              fontSize: 26,
              px: 7, py: 1.2,
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
  )
}
