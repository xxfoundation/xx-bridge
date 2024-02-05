import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography } from '@mui/material'
import StyledStack from '../components/Custom/StyledStack'
import StyledButton from '../components/Custom/StyledButton'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <StyledStack direction="column" spacing="40px" centerWidth centerHeight>
      <Typography variant="h1">Page Not Found</Typography>
      <Typography variant="h3">
        Sorry, but the page you were trying to view does not exist.
      </Typography>
      <StyledButton onClick={() => navigate('/')}>Home</StyledButton>
    </StyledStack>
  )
}

export default NotFound
