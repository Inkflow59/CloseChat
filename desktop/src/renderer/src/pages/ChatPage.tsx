import { useState, useEffect, useRef } from 'react'
import { Box, Stack, TextField, Typography } from '@mui/material'
import type { NavigateFn } from './HomePage'
import type { Room, Profile } from '../vite-env'
import { getLocalProfile } from '../profileStorage'
import AdminPanel from '../components/AdminPanel'
import AccountPanel from '../components/AccountPanel'

type Props = {
  navigate: NavigateFn
  room: Room
  username: string
  token: string
  localIP: string
  isHost: boolean
  initialMembers: string[]
  initialMessages: { from: { username: string }; message: string; at: string }[]
  initialProfiles: { username: string; profile: { avatar_emoji: string; status: string; bio: string } }[]
  onUsernameChange: (newUsername: string, newToken: string) => void
}

type Message = {
  id: string
  from: string
  text: string
}

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export default function ChatPage({ room, username, token, localIP, isHost, initialMembers, initialMessages, initialProfiles, onUsernameChange }: Props) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages.map((m) => ({
      id: `hist-${m.at}-${m.from.username}`,
      from: m.from.username,
      text: m.message,
    })),
  )
  const [members, setMembers] = useState<string[]>(() => {
    const all = [username, ...initialMembers.filter((m) => m !== username)]
    return [...new Set(all)]
  })
  const [input, setInput] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)
  const [profiles, setProfiles] = useState<Record<string, Profile>>(() => {
    const init: Record<string, Profile> = {}
    // Propre profil depuis localStorage
    const own = getLocalProfile(username)
    init[username] = { username, avatar_emoji: own.avatar_emoji, status: own.status as Profile['status'], bio: own.bio }
    // Profils des membres existants reçus via join_room_ack
    for (const mp of initialProfiles) {
      init[mp.username] = {
        username: mp.username,
        avatar_emoji: mp.profile?.avatar_emoji || '😊',
        status: (mp.profile?.status as Profile['status']) || 'available',
        bio: mp.profile?.bio || '',
      }
    }
    return init
  })
  const [showAccount, setShowAccount] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<Room>(room)
  const bottomRef = useRef<HTMLDivElement>(null)

  function notify(title: string, body: string) {
    window.closechatLan.notify({ title, body }).catch(() => {})
  }

  useEffect(() => {
    window.closechatLan.onMessage((raw) => {
      const msg = raw as Record<string, unknown>

      if (msg.type === 'message') {
        const from = msg.from as Record<string, string>
        setMessages((prev) => [
          ...prev,
          {
            id: `${msg.at}-${from.username}-${Math.random()}`,
            from: from.username,
            text: msg.message as string,
          },
        ])
        if (from.username !== username) {
          notify(from.username, msg.message as string)
        }
      }

      if (msg.type === 'presence') {
        const user = (msg.user as Record<string, string>) ?? {}
        const incomingProfile = msg.profile as { avatar_emoji: string; status: string; bio: string } | null
        if (msg.action === 'join') {
          setMembers((prev) => [...new Set([...prev, user.username])])
          if (incomingProfile) {
            setProfiles((prev) => ({
              ...prev,
              [user.username]: {
                username: user.username,
                avatar_emoji: incomingProfile.avatar_emoji || '😊',
                status: (incomingProfile.status as Profile['status']) || 'available',
                bio: incomingProfile.bio || '',
              },
            }))
          }
          if (user.username !== username) {
            notify('CloseChat — ' + currentRoom.name, `${user.username} a rejoint le salon`)
          }
        } else if (msg.action === 'leave') {
          setMembers((prev) => prev.filter((m) => m !== user.username))
          if (user.username !== username) {
            notify('CloseChat — ' + currentRoom.name, `${user.username} a quitté le salon`)
          }
        }
      }

      if (msg.type === 'user_renamed') {
        const { oldUsername, newUsername } = msg as Record<string, string>
        setMembers((prev) => prev.map((m) => (m === oldUsername ? newUsername : m)))
        if (oldUsername !== username) {
          notify('CloseChat', `${oldUsername} s'appelle maintenant ${newUsername}`)
        }
      }

      if (msg.type === 'profile_updated') {
        const { username: u, profile } = msg as { username: string; profile: { avatar_emoji: string; status: string; bio: string } }
        setProfiles((prev) => ({ ...prev, [u]: { username: u, avatar_emoji: profile.avatar_emoji, status: profile.status as 'available' | 'busy' | 'dnd', bio: profile.bio } }))
      }
    })

    return () => {
      window.closechatLan.clientLeave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || !token) return
    setInput('')
    try {
      await window.closechatLan.clientSendMessage({ message: text, room: room.name, token })
    } catch (err) {
      console.error('Erreur envoi message :', err)
    }
  }

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fdf7f2',
        overflow: 'hidden',
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
        <Typography
          sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 26, color: '#ffffff' }}
        >
          CloseChat
        </Typography>

        {isHost ? (
          <Box
            onClick={() => setShowAdmin(true)}
            sx={{
              border: '2px solid rgba(255,255,255,0.7)',
              borderRadius: 2,
              px: 3,
              py: 0.5,
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
            }}
          >
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 20, color: '#ffffff' }}>
              Administrer le salon
            </Typography>
          </Box>
        ) : (
          <Box />
        )}

        <Typography
          sx={{
            fontFamily: '"Caveat", system-ui, sans-serif',
            fontSize: 20,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {localIP || '…'}
        </Typography>
      </Box>

      {/* Corps : chat + sidebar */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Colonne gauche : messages */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid rgba(229,231,235,0.9)',
          }}
        >
          {/* Nom du salon */}
          <Typography
            sx={{
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: 32,
              color: '#1f2933',
              textAlign: 'center',
              py: 1.5,
              borderBottom: '1px solid rgba(229,231,235,0.7)',
              flexShrink: 0,
            }}
          >
            {currentRoom.name}
          </Typography>

          {/* Zone messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 3,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            {messages.map((msg) => {
              const isMine = msg.from === username
              return (
                <Box
                  key={msg.id}
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Caveat", system-ui, sans-serif',
                      fontSize: 18,
                      color: '#6b7280',
                      mb: 0.4,
                    }}
                  >
                    {msg.from}
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-block',
                      border: isMine ? '1.5px solid #b25a33' : '1.5px solid #d1d5db',
                      borderRadius: 3,
                      px: 2.5,
                      py: 1,
                      bgcolor: isMine ? '#fdf0e8' : '#ffffff',
                      maxWidth: '68%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Caveat", system-ui, sans-serif',
                        fontSize: 20,
                        color: '#1f2933',
                      }}
                    >
                      {msg.text}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
            <div ref={bottomRef} />
          </Box>

          {/* Barre de saisie */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.5,
              borderTop: '1px solid rgba(229,231,235,0.9)',
              bgcolor: '#ffffff',
              flexShrink: 0,
            }}
          >
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 44,
                  backgroundColor: '#ffffff',
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
            <Box
              onClick={send}
              sx={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #1f2933',
                borderRadius: 2,
                cursor: 'pointer',
                flexShrink: 0,
                color: '#1f2933',
                bgcolor: '#ffffff',
                transition: 'background 0.12s',
                '&:hover': { bgcolor: '#f3f4f6' },
              }}
            >
              <SendIcon />
            </Box>
          </Box>
        </Box>

        {/* Sidebar droite : membres */}
        <Box
          sx={{
            width: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            px: 2,
            py: 2,
            flexShrink: 0,
          }}
        >
          <Stack spacing={0.8}>
            {members.map((m) => {
              const p = profiles[m]
              const statusColor = p?.status === 'busy' ? '#f59e0b' : p?.status === 'dnd' ? '#ef4444' : '#22c55e'
              return (
                <Box key={m} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 20, lineHeight: 1 }}>{p?.avatar_emoji || '😊'}</Typography>
                    <Box sx={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor, border: '1.5px solid #fdf7f2' }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 17, color: '#1f2933', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m}
                    </Typography>
                    {p?.bio ? (
                      <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 13, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.bio}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              )
            })}
          </Stack>

          <Box
            onClick={() => setShowAccount(true)}
            sx={{
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: 2,
              px: 1,
              py: 0.5,
              transition: 'background 0.12s',
              '&:hover': { bgcolor: 'rgba(178,90,51,0.07)' },
            }}
          >
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 16, color: '#6b7280', lineHeight: 1.4 }}>
              Connecté en tant que
            </Typography>
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#374151' }}>
              {username}
            </Typography>
          </Box>
        </Box>
      </Box>

      {showAccount && (
        <AccountPanel
          username={username}
          localIP={localIP}
          room={currentRoom}
          token={token}
          onClose={() => setShowAccount(false)}
          onUsernameChange={(newUsername, newToken) => {
            onUsernameChange(newUsername, newToken)
            setShowAccount(false)
          }}
          onProfileSaved={(profile) => {
            setProfiles((prev) => ({ ...prev, [username]: profile }))
          }}
        />
      )}

      {showAdmin && (
        <AdminPanel
          room={currentRoom}
          localIP={localIP}
          currentUsername={username}
          onClose={(updatedRoom) => {
            if (updatedRoom) setCurrentRoom(updatedRoom)
            setShowAdmin(false)
          }}
        />
      )}
    </Box>
  )
}
