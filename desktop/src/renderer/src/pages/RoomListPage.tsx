import { useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import type { NavigateFn } from './HomePage'
import type { Room } from '../vite-env'

type Props = {
  navigate: NavigateFn
  rooms: Room[]
  localIP: string
  username: string
  token: string
}

function LockIcon() {
  return (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', color: '#374151', flexShrink: 0, ml: 2 }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </Box>
  )
}

export default function RoomListPage({ navigate, rooms, localIP, username, token }: Props) {
  const [passwordTarget, setPasswordTarget] = useState<Room | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null)

  async function joinRoom(room: Room, roomPassword?: string) {
    setJoiningRoom(room.name)
    setJoinError('')
    try {
      const result = await window.closechatLan.clientJoin({
        url: `ws://${room.host}:${room.port}`,
        room: room.name,
        token,
        roomPassword: roomPassword || undefined,
      })
      setPasswordTarget(null)
      navigate('chat', { room, token, localIP, initialMembers: result.members ?? [] })
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Impossible de rejoindre le salon.')
    } finally {
      setJoiningRoom(null)
    }
  }

  function handleRoomClick(room: Room) {
    if (room.protected) {
      setPasswordTarget(room)
      setPasswordInput('')
      setJoinError('')
    } else {
      joinRoom(room)
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
      <Box
        sx={{
          width: '100%',
          maxWidth: 860,
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
        <Stack spacing={2} sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 3.5 } }}>
          <Typography
            sx={{
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: { xs: 22, sm: 28 },
              color: '#374151',
              textAlign: 'center',
              mb: 0.5,
            }}
          >
            Ne soyez pas timide, rejoignez la discussion !
          </Typography>

          {rooms.map((room, idx) => (
            <Box
              key={idx}
              onClick={() => !joiningRoom && handleRoomClick(room)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                borderRadius: 3,
                border: '1px solid rgba(229, 231, 235, 0.9)',
                bgcolor: '#ffffff',
                cursor: joiningRoom ? 'wait' : 'pointer',
                opacity: joiningRoom === room.name ? 0.7 : 1,
                transition: 'box-shadow 0.15s, border-color 0.15s',
                '&:hover': {
                  boxShadow: '0 4px 14px rgba(17, 24, 39, 0.10)',
                  borderColor: 'rgba(178, 90, 51, 0.35)',
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: { xs: 24, sm: 30 }, color: '#1f2933', lineHeight: 1.2 }}
                >
                  {room.name}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Caveat", system-ui, sans-serif',
                    fontSize: 16,
                    color: '#6b7280',
                    mt: 0.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {room.members.length > 0
                    ? `Membres : ${room.members.join(', ')}`
                    : 'Aucun membre connecté'}
                </Typography>
              </Box>
              {room.protected && <LockIcon />}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Dialog mot de passe */}
      {passwordTarget && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setPasswordTarget(null) }}
        >
          <Box
            sx={{
              bgcolor: '#ffffff',
              borderRadius: 4,
              boxShadow: '0 14px 30px rgba(17,24,39,0.18)',
              px: 4,
              py: 3.5,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Typography
              sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 26, color: '#1f2933', mb: 1 }}
            >
              Rejoindre « {passwordTarget.name} »
            </Typography>
            <Typography
              sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 20, color: '#374151', mb: 0.5 }}
            >
              Mot de passe :
            </Typography>
            <TextField
              autoFocus
              size="small"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom(passwordTarget, passwordInput)}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  height: 44,
                  fontFamily: '"Caveat", system-ui, sans-serif',
                  fontSize: 20,
                  borderRadius: '10px',
                  '& fieldset': { borderColor: '#d1d5db' },
                  '&:hover fieldset': { borderColor: '#b25a33' },
                  '&.Mui-focused fieldset': { borderColor: '#b25a33' },
                },
                '& .MuiOutlinedInput-input': { px: 1.4, py: 0 },
              }}
            />
            {joinError && (
              <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#b91c1c', mb: 1 }}>
                {joinError}
              </Typography>
            )}
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => setPasswordTarget(null)}
                sx={{
                  fontFamily: '"Caveat", system-ui, sans-serif',
                  fontSize: 20,
                  textTransform: 'none',
                  borderColor: '#d1d5db',
                  color: '#374151',
                  borderRadius: 2,
                }}
              >
                Annuler
              </Button>
              <Button
                variant="contained"
                disabled={!!joiningRoom}
                onClick={() => joinRoom(passwordTarget, passwordInput)}
                sx={{
                  fontFamily: '"Caveat", system-ui, sans-serif',
                  fontSize: 20,
                  textTransform: 'none',
                  backgroundColor: '#b25a33',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#a24f2c' },
                }}
              >
                {joiningRoom ? 'Connexion…' : 'Rejoindre'}
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  )
}
