import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import type { NavigateFn } from './HomePage'

type Props = {
  navigate: NavigateFn
}

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    height: 42,
    backgroundColor: '#ffffff',
    fontFamily: '"Caveat", system-ui, sans-serif',
    fontSize: 22,
    borderRadius: '10px',
    '& fieldset': {
      borderColor: '#d1d5db',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: '#b25a33',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#b25a33',
    },
  },
  '& .MuiOutlinedInput-input': {
    px: 1.4,
    py: 0,
  },
}

const labelStyles = {
  fontFamily: '"Caveat", system-ui, sans-serif',
  fontSize: 24,
  color: '#374151',
  pl: 0.5,
}

export default function SignupPage({ navigate }: Props) {
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
      <Stack
        spacing={1.3}
        sx={{
          width: '100%',
          maxWidth: 660,
          alignItems: 'center',
          bgcolor: 'rgba(255,255,255,0.82)',
          borderRadius: 4,
          border: '1px solid rgba(229, 231, 235, 0.9)',
          boxShadow: '0 14px 30px rgba(17, 24, 39, 0.12)',
          px: { xs: 3, md: 5 },
          py: { xs: 3, md: 4.5 },
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Caveat", system-ui, sans-serif',
            fontSize: 30,
            color: '#374151',
            lineHeight: 1.2,
          }}
        >
          Bienvenue sur
        </Typography>

        <Typography
          component="h1"
          sx={{
            fontFamily: '"Caveat", system-ui, sans-serif',
            fontSize: { xs: 56, sm: 64 },
            color: '#1f2933',
            lineHeight: 1.1,
          }}
        >
          CloseChat
        </Typography>

        <Typography
          sx={{
            fontFamily: '"Caveat", system-ui, sans-serif',
            fontSize: 22,
            color: '#6b7280',
            mb: 0.9,
          }}
        >
          Renseignez vos informations, on s&apos;occupe du tout !
        </Typography>

        <Stack spacing={0.6} sx={{ width: '100%' }}>
          <Typography sx={labelStyles}>Pseudonyme :</Typography>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            inputProps={{ 'aria-label': 'Pseudonyme' }}
            sx={fieldStyles}
          />
        </Stack>

        <Stack spacing={0.6} sx={{ width: '100%' }}>
          <Typography sx={labelStyles}>E-mail :</Typography>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            inputProps={{ 'aria-label': 'E-mail' }}
            sx={fieldStyles}
          />
        </Stack>

        <Stack spacing={0.6} sx={{ width: '100%' }}>
          <Typography sx={labelStyles}>Mot de passe :</Typography>
          <TextField
            size="small"
            type="password"
            fullWidth
            variant="outlined"
            inputProps={{ 'aria-label': 'Mot de passe' }}
            sx={fieldStyles}
          />
        </Stack>

        <Stack spacing={0.6} sx={{ width: '100%' }}>
          <Typography sx={labelStyles}>Confirmation du mot de passe :</Typography>
          <TextField
            size="small"
            type="password"
            fullWidth
            variant="outlined"
            inputProps={{ 'aria-label': 'Confirmation du mot de passe' }}
            sx={fieldStyles}
          />
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ pt: 1.1 }}>
          <Button
            variant="contained"
            onClick={() => navigate('discover')}
            sx={{
              py: 0.8,
              px: 4.2,
              minWidth: 'fit-content',
              borderRadius: 2.5,
              backgroundColor: '#b25a33',
              boxShadow: '0 8px 18px rgba(148, 64, 28, 0.32)',
              color: '#fffdfc',
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: 25,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#a24f2c',
                boxShadow: '0 6px 14px rgba(148, 64, 28, 0.38)',
              },
            }}
          >
            S&apos;inscrire
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('login')}
            sx={{
              py: 0.8,
              px: 3.4,
              minWidth: 'fit-content',
              borderRadius: 2.5,
              borderColor: '#d1d5db',
              color: '#374151',
              backgroundColor: '#ffffff',
              fontFamily: '"Caveat", system-ui, sans-serif',
              fontSize: 25,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#b8bec7',
                backgroundColor: '#f9fafb',
              },
            }}
          >
            Retour connexion
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
