import React from 'react'
import { Link, Typography, useMediaQuery } from '@mui/material'
import landscape from '../assets/logo/png/xxbridge.png'

import ImageWrapper from '../components/Custom/ImageWrapper'
import StyledStack from '../components/Custom/StyledStack'
import Login from '../components/User/Login'
import xxbridge from '@/components/Custom/XXBridge'

const MobileMessage: React.FC = () => (
  <StyledStack centerHeight centerWidth>
    <Typography
      variant="h4"
      sx={{ color: 'primary.main', margin: '40px', textAlign: 'center' }}
    >
      {xxbridge} is not yet available for mobile.
    </Typography>
  </StyledStack>
)

const ConnectPage: React.FC = () => {
  // check if on mobile
  const isMobile = useMediaQuery('(max-width:728px)')

  return (
    <>
      {isMobile ? (
        <MobileMessage />
      ) : (
        <StyledStack direction="column" spacing="40px" centerWidth centerHeight>
          <ImageWrapper src={landscape} alt="Logo with slogan" width="70%" />
          <Login />
        </StyledStack>
      )}
    </>
  )
}

export default ConnectPage
