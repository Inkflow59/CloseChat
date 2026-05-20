import { useState, useEffect } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import type { NavigateFn } from './HomePage'

type Props = {
  navigate: NavigateFn
  localIP: string
  username: string
  token: string
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

export default function CreateRoomPage({ navigate, localIP: ipProp, username, token: tokenProp }: Props) {
  const [roomName, setRoomName] = useState('')
  const [password, setPassword] = useState('')
  const [localIP, setLocalIP] = useState(ipProp ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localIP) {
      window.closechatLan.getLocalIP().then((r) => setLocalIP(r.ip)).catch(() => {})
    }
  }, [localIP])

  async function handleCreate() {
    if (!roomName.trim()) return
    setLoading(true)
    setError('')
    try {
      // Obtenir un token valide (celui du login ou en générer un local)
      let jwtToken = tokenProp
      if (!jwtToken && username) {
        const result = await window.closechatLan.signLocalToken({ username })
        jwtToken = result.token
      }

      await window.closechatLan.hostStart()
      await window.closechatLan.hostCreateRoom({
        room: roomName.trim(),
        roomPassword: password.trim() || undefined,
      })

      // Le créateur rejoint directement son propre salon
      const joinResult = await window.closechatLan.clientJoin({
        url: 'ws://127.0.0.1:5050',
        room: roomName.trim(),
        token: jwtToken,
        roomPassword: password.trim() || undefined,
      })

      navigate('chat', {
        room: {
          name: roomName.trim(),
          protected: !!password.trim(),
          members: [],
          host: '127.0.0.1',
          port: 5050,
        },
        token: jwtToken,
        localIP,
        isHost: true,
        initialMembers: joinResult.members ?? [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
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
        backgroundImage:
          'radial-gradient(circle at left bottom, rgba(218,233,221,0.92), transparent 55%), radial-gradient(circle at right top, rgba(242,223,215,0.88), transparent 60%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 700,
          bgcolor: 'rgba(255,255,255,0.82)',
          borderRadius: 4,
          border: '1px solid rgba(229, 231, 235, 0.9)',
          boxShadow: '0 14px 30px rgba(17, 24, 39, 0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 1.5,
            backgroundColor: '#b25a33',
          }}
        >
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 26, color: '#ffffff' }}>
            CloseChat
          </Typography>
          <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 20, color: 'rgba(255,255,255,0.85)' }}>
            {localIP || '…'}
          </Typography>
        </Box>

        {/* Content */}
        <Stack spacing={2.5} sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
          <Stack spacing={0.5} alignItems="center" textAlign="center">
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 20, color: '#6b7280' }}>
              Tiens, on se sent seul ici, vous ne trouvez pas ?
            </Typography>
            <Typography
              component="h1"
              sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: { xs: 34, sm: 42 }, color: '#1f2933', lineHeight: 1.15 }}
            >
              Créez votre salon maintenant !
            </Typography>
          </Stack>

          <Stack spacing={0.6}>
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 22, color: '#374151', pl: 0.5 }}>
              Nom du salon
            </Typography>
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              inputProps={{ 'aria-label': 'Nom du salon' }}
              sx={fieldSx}
            />
          </Stack>

          <Stack spacing={0.6}>
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 22, color: '#374151', pl: 0.5 }}>
              Mot de passe (optionnel)
            </Typography>
            <TextField
              size="small"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              inputProps={{ 'aria-label': 'Mot de passe optionnel' }}
              sx={fieldSx}
            />
          </Stack>

          {error && (
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#b91c1c', textAlign: 'center' }}>
              {error}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Button
              variant="outlined"
              disabled={loading || !roomName.trim()}
              onClick={handleCreate}
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                textTransform: 'none',
                fontSize: 26,
                px: 6,
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
              {loading ? 'Création…' : "Et c'est parti !"}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
