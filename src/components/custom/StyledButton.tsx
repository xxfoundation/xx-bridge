import { Button, ButtonProps } from '@mui/material'
import React from 'react'

interface StyledButtonProps extends ButtonProps {}

const StyledButton: React.FC<StyledButtonProps> = props => {
  const { children, sx, ...rest } = props
  return (
    <Button
      {...rest}
      variant="contained"
      color="primary"
      sx={{
        borderRadius: '22px',
        fontWeight: 'bold',
        ...sx
      }}
    >
      {children}
    </Button>
  )
}

export default StyledButton
