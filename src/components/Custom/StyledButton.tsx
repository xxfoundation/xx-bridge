import { Button, ButtonProps } from '@mui/material'
import React from 'react'

interface StyledButtonProps extends ButtonProps {
  children: React.ReactNode
}

const StyledButton: React.FC<StyledButtonProps> = props => {
  const { children, ...rest } = props
  return (
    <Button {...rest} variant="contained" color="primary">
      {children}
    </Button>
  )
}

export default StyledButton
