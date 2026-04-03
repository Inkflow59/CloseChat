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
    <Stack spacing={3}>
      {items.map((item, index) => (
        <Card
          key={item.id}
          elevation={4}
          sx={(theme) => ({
            maxWidth: 360,
            ml: index === 1 ? 8 : 0,
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
                fontFamily: '"Gloria Hallelujah", system-ui, sans-serif',
                fontSize: 18,
                mb: 0.5,
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

