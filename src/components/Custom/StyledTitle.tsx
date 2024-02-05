import { Info } from '@mui/icons-material'
import { Stack, StackProps, Tooltip, Typography } from '@mui/material'
import React from 'react'

interface StyledTitleProps extends StackProps {
  title: string
  tooltipText?: string
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const StyledTitle: React.FC<StyledTitleProps> = ({
  title,
  tooltipText = '',
  tooltipPlacement = 'right',
  variant = 'h6',
  ...props
}) => {
  const { sx, ...rest } = props
  return (
    <Stack
      direction="row"
      spacing="5px"
      alignItems="center"
      sx={{ marginTop: '20px', ...sx }}
    >
      <Typography
        variant={variant}
        {...rest}
        sx={{ color: 'primary.main', ...sx }}
      >
        {title}
      </Typography>
      <Tooltip title={tooltipText} placement={tooltipPlacement}>
        <Info sx={{ height: '20px', color: 'primary.main' }} />
      </Tooltip>
    </Stack>
  )
}

export default StyledTitle
