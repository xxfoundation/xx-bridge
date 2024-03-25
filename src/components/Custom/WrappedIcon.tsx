import { IconButton, IconButtonProps } from '@mui/material'
import React from 'react'

interface WrappedIconProps extends IconButtonProps {
  icon: React.ReactNode
  size?: 'small' | 'medium' | 'large'
}

const WrappedIcon: React.FC<WrappedIconProps> = ({
  icon,
  size = 'small',
  ...props
}) => {
  const fontSize =
    size === 'small'
      ? '0.7em'
      : size === 'medium'
        ? '1em'
        : size === 'large'
          ? '1.3em'
          : '1em'

  return (
    <IconButton
      sx={{
        padding: '0.1em',
        margin: 0,
        svg: {
          fontSize
        }
      }}
      {...props}
    >
      {icon}
    </IconButton>
  )
}

export default WrappedIcon
