import { Box, BoxProps } from '@mui/material'
import React from 'react'

interface StyledBoxProps extends BoxProps {
  children: React.ReactNode
}

const StyledBox: React.FC<StyledBoxProps> = props => {
  const { children, ...rest } = props
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%'
      }}
      {...rest}
    >
      {children}
    </Box>
  )
}

export default StyledBox
