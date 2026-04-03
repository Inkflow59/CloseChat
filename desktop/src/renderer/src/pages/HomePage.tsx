import { Box, Button, Stack, Typography } from '@mui/material'
import ChatBubbles from '../components/ChatBubbles'

type Route = 'home'

export type NavigateFn = (route: Route) => void

type Props = {
  navigate: NavigateFn
}

export default function HomePage({ navigate }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#fdf7f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        py: 6,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 1040,
          display: 'grid',
          gap: 8,
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1.2fr' },
        }}
      >
        {/* Cercles de fond */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at left bottom, rgba(218,233,221,0.95), transparent 58%), radial-gradient(circle at right top, rgba(242,223,215,0.95), transparent 55%)',
            zIndex: -1,
          }}
        />

        {/* Colonne gauche : logo + boutons */}
        <Stack spacing={5} alignItems="flex-start">
          <Stack spacing={1}>
            <Typography
              component="h1"
              sx={{
                fontFamily: '"Gloria Hallelujah", system-ui, sans-serif',
                fontSize: { xs: 40, sm: 52, md: 64 },
                lineHeight: 1.05,
                color: '#1f2933',
              }}
            >
              CloseChat
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Gloria Hallelujah", system-ui, sans-serif',
                fontSize: { xs: 18, sm: 20 },
                color: '#6b7280',
              }}
            >
              Pour les conversations entre nous
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={() => navigate('home')}
              sx={{
                fontFamily: '"Gloria Hallelujah", system-ui, sans-serif',
                textTransform: 'none',
                fontSize: 18,
                px: 6,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: '#b25a33',
                boxShadow: '0 12px 0 rgba(162,79,44,0.25)',
                '&:hover': {
                  backgroundColor: '#a24f2c',
                  boxShadow: '0 10px 0 rgba(162,79,44,0.25)',
                },
              }}
            >
              Je veux chatter !
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('home')}
              sx={{
                fontFamily: '"Gloria Hallelujah", system-ui, sans-serif',
                textTransform: 'none',
                fontSize: 18,
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'center' } }}>
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
                author: 'Michel Dupré',
                variant: 'rose',
              },
            ]}
          />
        </Box>
      </Box>
    </Box>
  )
}

