import { Box, Button, Stack, Typography } from '@mui/material'
import type { NavigateFn } from './HomePage'

type Props = {
  navigate: NavigateFn
}

export default function AboutPage({ navigate }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        boxSizing: 'border-box',
        bgcolor: '#fdf7f2',
        px: { xs: 3, md: 6 },
        py: { xs: 4, md: 6 },
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
          maxWidth: 980,
          mx: 'auto',
        }}
      >
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
              right: { xs: 16, md: 32 },
              top: { xs: 16, md: 24 },
              width: { xs: 52, md: 64 },
              height: { xs: 52, md: 64 },
              borderRadius: '999px',
              border: '3px solid rgba(178,90,51,0.35)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 20, md: 48 },
              bottom: { xs: -8, md: 0 },
              width: { xs: 84, md: 100 },
              height: 24,
              borderRadius: 999,
              border: '2px dashed rgba(148,163,184,0.65)',
              transform: 'rotate(-7deg)',
            }}
          />
        </Box>

        <Stack spacing={{ xs: 3, md: 4 }} sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box component="img" src="./icon.png" alt="CloseChat" sx={{ width: 64, height: 64, borderRadius: 2.5 }} />
            <Typography
              component="h1"
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: { xs: 40, md: 56 },
                lineHeight: 1,
                color: '#111827',
                textAlign: 'center',
              }}
            >
              CloseChat
            </Typography>
            <Typography sx={{ fontFamily: '"Caveat", system-ui, sans-serif', fontSize: 18, color: '#9ca3af' }}>
              v{__APP_VERSION__}
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <Typography
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: { xs: 20, md: 24 },
                lineHeight: 1.3,
                color: '#111827',
              }}
            >
              CloseChat est une application de chat pensée pour les petits groupes et les
              vraies conversations. Pas de flux infini, pas d&apos;algorithme : juste vous
              et les gens qui comptent.
            </Typography>

            <Typography
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: { xs: 20, md: 24 },
                lineHeight: 1.3,
                color: '#111827',
              }}
            >
              Créez ou rejoignez un salon, choisissez un pseudo, et commencez à discuter en
              temps réel. Les salons peuvent être publics ou protégés par un mot de passe.
            </Typography>

            <Typography
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: { xs: 20, md: 24 },
                lineHeight: 1.3,
                color: '#111827',
              }}
            >
              Nous croyons que les meilleures conversations se passent dans des espaces
              intimes, où l&apos;on se connaît vraiment.
            </Typography>
          </Stack>

          <Box>
            <Button
              variant="outlined"
              onClick={() => navigate('home')}
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                textTransform: 'none',
                fontSize: 20,
                px: 4,
                py: 1,
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
              Retour
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
