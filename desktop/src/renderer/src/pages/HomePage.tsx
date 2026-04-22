import { Box, Button, Stack, Typography } from '@mui/material'
import ChatBubbles from '../components/ChatBubbles'

type Route = 'home' | 'about' | 'login' | 'signup'

export type NavigateFn = (route: Route) => void

type Props = {
  navigate: NavigateFn
}

export default function HomePage({ navigate }: Props) {
  return (
    <Box
      sx={{
        height: '100dvh',
        maxHeight: '100dvh',
        boxSizing: 'border-box',
        bgcolor: '#fdf7f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        py: { xs: 2, md: 4 },
        overflow: 'hidden',
        backgroundImage:
          'radial-gradient(circle at left bottom, rgba(218,233,221,0.95), transparent 60%), radial-gradient(circle at right top, rgba(242,223,215,0.95), transparent 60%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 1040,
          display: 'grid',
          gap: { xs: 6, md: 8 },
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1.2fr' },
        }}
      >
        {/* Petites formes décoratives */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 20, md: 40 },
              top: { xs: 32, md: 52 },
              width: { xs: 48, md: 64 },
              height: { xs: 48, md: 64 },
              borderRadius: '999px',
              border: '3px solid rgba(178,90,51,0.45)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 40, md: 84 },
              top: { xs: 88, md: 104 },
              width: 10,
              height: 10,
              borderRadius: '999px',
              backgroundColor: 'rgba(178,90,51,0.7)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: { xs: 24, md: 80 },
              bottom: { xs: 32, md: 64 },
              width: { xs: 72, md: 92 },
              height: 22,
              borderRadius: 999,
              border: '2px dashed rgba(148,163,184,0.7)',
              transform: 'rotate(-6deg)',
            }}
          />
        </Box>

        {/* Colonne gauche : logo + boutons */}
        <Stack
          spacing={{ xs: 4, md: 5 }}
          sx={{ alignItems: 'center' }}
        >
          <Stack spacing={1} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography
              component="h1"
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: { xs: 44, sm: 56, md: 68 },
                lineHeight: 1.05,
                color: '#1f2933',
              }}
            >
              CloseChat
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: { xs: 20, sm: 22 },
                color: '#6b7280',
              }}
            >
              Pour les conversations entre nous
            </Typography>
          </Stack>

          <Stack
            spacing={2}
            sx={{ width: '100%', alignItems: 'center' }}
          >
            <Button
              variant="contained"
              onClick={() => navigate('login')}
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                textTransform: 'none',
                fontSize: 20,
                px: 6,
                py: 1.5,
                borderRadius: 3,
                backgroundColor: '#b25a33',
                boxShadow: '0 10px 24px rgba(148, 64, 28, 0.45)',
                position: 'relative',
                overflow: 'visible',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  transform: 'translateY(10px)',
                  borderRadius: 12,
                  backgroundColor: 'rgba(211, 180, 166, 0.85)',
                  zIndex: -1,
                },
                '&:hover': {
                  backgroundColor: '#a24f2c',
                  boxShadow: '0 8px 20px rgba(148, 64, 28, 0.5)',
                },
              }}
            >
              Je veux chatter !
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('about')}
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                textTransform: 'none',
                fontSize: 20,
                px: 6,
                py: 1.5,
                borderRadius: 2,
                borderColor: '#d0d0d0',
                color: '#374151',
                backgroundColor: '#ffffff',
                '&:hover': {
                  backgroundColor: '#f9fafb',
                  borderColor: '#c4c4c4',
                },
              }}
            >
              À propos
            </Button>
          </Stack>
        </Stack>

        {/* Colonne droite : bulles de chat */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', md: 'center' },
            pr: { xs: 0, md: 4 },
          }}
        >
          <ChatBubbles
            items={[
              {
                id: '1',
                text: 'Hé ! Tu viens chatter ?',
                author: 'Didier Dulard',
                variant: 'neutral',
              },
              {
                id: '2',
                text: 'Bien sûr, rejoins le salon Chillax !',
                author: 'Michel Dubrel',
                variant: 'rose',
              },
            ]}
          />
        </Box>
      </Box>
    </Box>
  )
}

