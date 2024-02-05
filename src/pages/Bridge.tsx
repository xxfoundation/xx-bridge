import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography } from '@mui/material'
import StyledStack from '../components/Custom/StyledStack'
import StyledButton from '../components/Custom/StyledButton'

const Bridge: React.FC = () => {
  const navigate = useNavigate()

  return (
    <StyledStack direction="column" spacing="40px" centerWidth centerHeight>
      <Typography variant="h1">Bridge</Typography>
      <Typography variant="h3">Under construction...</Typography>
      <StyledButton onClick={() => navigate('/')}>Home</StyledButton>
    </StyledStack>
  )
}

export default Bridge
