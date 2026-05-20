import { useState, useEffect } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import type { Room } from '../vite-env'

type Member = { userId: string; username: string; ip: string }

type Props = {
  room: Room
  localIP: string
  currentUsername: string
  onClose: (updatedRoom?: Room) => void
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

export default function AdminPanel({ room, localIP, currentUsername, onClose }: Props) {
  const [roomName, setRoomName] = useState(room.name)
  const [newPassword, setNewPassword] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMembers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchMembers() {
    try {
      const { members: m } = await window.closechatLan.hostGetRoomDetails({ room: room.name })
      setMembers(m.filter((m) => m.username !== currentUsername))
    } catch (_) {}
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const result = await window.closechatLan.hostUpdateRoom({
        room: room.name,
        newName: roomName.trim() || room.name,
        newPassword: newPassword || undefined,
      })
      onClose({ ...room, name: result.name, protected: newPassword ? true : room.protected })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  async function handleKick(member: Member) {
    try {
      await window.closechatLan.hostKickClient({ room: room.name, userId: member.userId })
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId))
    } catch (_) {}
  }

  async function handleBan(member: Member) {
    try {
      await window.closechatLan.hostBanClient({ room: room.name, userId: member.userId })
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId))
    } catch (_) {}
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
            onClick={() => onClose()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)',
              '&:hover': { color: '#ffffff' },
              mr: 1,
            }}
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
        <Box sx={{ width: '100%', maxWidth: 700 }}>

          {/* Section : modifier le salon */}
          <Typography
            sx={{
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: 20,
              color: '#6b7280',
              textAlign: 'center',
              mb: 3,
            }}
          >
            Un souci avec le salon ? Pas de soucis, tout ira bien, dites-nous ce que vous voulez changer
          </Typography>

          <Stack spacing={2.5} sx={{ mb: 4 }}>
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
                sx={fieldSx}
              />
            </Stack>
          </Stack>

          {/* Section : gestion des membres */}
          <Typography
            sx={{
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: 20,
              color: '#6b7280',
              textAlign: 'center',
              mb: 2,
            }}
          >
            Une personne un peu (trop) chiante ? Dites-nous qui, on s'en occupe
          </Typography>

          {members.length > 0 ? (
            <Box
              sx={{
                border: '1.5px solid #d1d5db',
                borderRadius: 3,
                overflow: 'hidden',
                mb: 4,
              }}
            >
              {members.map((member, idx) => (
                <Box
                  key={member.userId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    py: 1.8,
                    borderBottom: idx < members.length - 1 ? '1px solid #e5e7eb' : 'none',
                    bgcolor: '#ffffff',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Caveat", system-ui, sans-serif',
                      fontSize: 22,
                      color: '#1f2933',
                    }}
                  >
                    {member.username} ({member.ip})
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleBan(member)}
                      sx={{
                        fontFamily: '"Caveat", system-ui, sans-serif',
                        fontSize: 18,
                        textTransform: 'none',
                        borderColor: '#b25a33',
                        color: '#b25a33',
                        borderRadius: 2,
                        px: 1.8,
                        '&:hover': { bgcolor: '#fdf0e8', borderColor: '#a24f2c' },
                      }}
                    >
                      Bannir
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleKick(member)}
                      sx={{
                        fontFamily: '"Caveat", system-ui, sans-serif',
                        fontSize: 18,
                        textTransform: 'none',
                        borderColor: '#d1d5db',
                        color: '#374151',
                        borderRadius: 2,
                        px: 1.8,
                        '&:hover': { bgcolor: '#f9fafb' },
                      }}
                    >
                      Exclure
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: 20,
                color: '#9ca3af',
                textAlign: 'center',
                mb: 4,
              }}
            >
              Aucun autre membre connecté pour le moment.
            </Typography>
          )}

          {error && (
            <Typography
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: 18,
                color: '#b91c1c',
                textAlign: 'center',
                mb: 2,
              }}
            >
              {error}
            </Typography>
          )}

          {/* Bouton Enregistrer */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              disabled={saving}
              onClick={handleSave}
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
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
