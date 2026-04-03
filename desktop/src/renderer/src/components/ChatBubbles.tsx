import { Stack, Card, CardContent, Typography } from '@mui/material'

export type BubbleItem = {
  id: string
  text: string
  author: string
  variant?: 'neutral' | 'rose'
}

type Props = {
  items: BubbleItem[]
}

export default function ChatBubbles({ items }: Props) {
  return (
    <Stack
      spacing={3}
      sx={{
        width: '100%',
        maxWidth: 420,
        mx: 'auto',
        alignItems: 'stretch',
      }}
    >
      {items.map((item, index) => (
        <Card
          key={item.id}
          elevation={4}
          sx={(theme) => ({
            maxWidth: { xs: '78vw', sm: 360 },
            width: 'fit-content',
            alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end',
            borderRadius: 3,
            bgcolor: item.variant === 'rose' ? '#f2d9d3' : '#ffffff',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
            border: item.variant === 'rose' ? '1px solid #f1c6bf' : '1px solid rgba(255,255,255,0.9)',
            paddingY: 1,
            paddingX: 2.5,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: theme.spacing(4),
              bottom: -10,
              borderWidth: '10px 10px 0 10px',
              borderStyle: 'solid',
              borderColor: `${item.variant === 'rose' ? '#f2d9d3' : '#ffffff'} transparent transparent transparent`,
            },
            position: 'relative',
          })}
        >
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: '"Caveat", system-ui, sans-serif',
                fontSize: 20,
                mb: 0.5,
                wordBreak: 'break-word',
              }}
            >
              {item.text}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {item.author}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}

