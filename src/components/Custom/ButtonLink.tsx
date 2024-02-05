import { Info } from '@mui/icons-material'
import { Stack, StackProps, Tooltip, Typography } from '@mui/material'
import React from 'react'

interface ButtonLinkProps extends StackProps {
  text: string
  tooltipText?: string
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
  onClick: () => void
}

const ButtonLink: React.FC<ButtonLinkProps> = ({
  text,
  tooltipText = '',
  tooltipPlacement = 'right',
  onClick
}) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Typography
      variant="body1"
      sx={{
        width: 'fit-content',
        fontWeight: 'bold',
        cursor: 'pointer',
        textDecorationLine: 'underline',
        '&&:hover': {
          color: 'primary.main'
        }
      }}
      onClick={onClick}
    >
      {text}
    </Typography>
    {tooltipText && (
      <Tooltip title={tooltipText} placement={tooltipPlacement}>
        <Info sx={{ height: '15px', color: 'text.primary' }} />
      </Tooltip>
    )}
  </Stack>
)

export default ButtonLink
