import { Button, ButtonProps } from '@mui/material'
import React from 'react'

interface StyledButtonProps extends ButtonProps {
  small?: boolean
}

const StyledButton: React.FC<StyledButtonProps> = props => {
  const { children, small, sx, ...rest } = props
  return (
    <Button
      {...rest}
      variant="contained"
      color="primary"
      sx={{
        borderRadius: '22px',
        fontWeight: 'bold',
        height: small ? '30px' : 'auto',
        fontSize: small ? '12px' : 'auto',
        ...sx
      }}
    >
      {children}
    </Button>
  )
}

export default StyledButton
