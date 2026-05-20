import { useEffect } from 'react'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import type { NavigateFn } from './HomePage'

type Props = {
  navigate: NavigateFn
}

export default function DiscoveryPage({ navigate }: Props) {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await window.closechatLan.discoverAndListRooms()
        if (cancelled) return
        if (result.rooms.length > 0) {
          navigate('room-list', { rooms: result.rooms, localIP: result.localIP })
        } else {
          navigate('create-room', { rooms: [], localIP: result.localIP })
        }
      } catch (_) {
        if (!cancelled) navigate('create-room', { rooms: [], localIP: '' })
      }
    })()
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <Stack spacing={3} alignItems="center">
        <CircularProgress size={56} thickness={3} sx={{ color: '#b25a33' }} />
        <Typography
          sx={{
            fontFamily: '"Caveat", system-ui, sans-serif',
            fontSize: 30,
            color: '#374151',
          }}
        >
          Analyse du réseau en cours…
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Caveat", system-ui, sans-serif',
            fontSize: 22,
            color: '#9ca3af',
          }}
        >
          On cherche des salons disponibles pour vous !
        </Typography>
      </Stack>
    </Box>
  )
}
