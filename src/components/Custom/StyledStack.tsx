import { Stack, StackProps } from '@mui/material'
import React from 'react'

interface StyledStackProps extends StackProps {
  children: React.ReactNode
  centerWidth?: boolean
  centerHeight?: boolean
  endHeight?: boolean
}

const StyledStack: React.FC<StyledStackProps> = ({
  children,
  centerWidth = false,
  centerHeight = false,
  endHeight = false,
  ...props
}) => {
  const alignItems = centerWidth ? 'center' : 'flex-start'
  const justifyContent = centerHeight
    ? 'center'
    : endHeight
      ? 'flex-end'
      : 'flex-start'

  return (
    <Stack
      sx={{
        justifyContent,
        alignItems,
        height: '100%'
      }}
      {...props}
    >
      {children}
    </Stack>
  )
}

export default StyledStack
