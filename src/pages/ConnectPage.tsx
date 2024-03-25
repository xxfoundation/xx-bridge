import React from 'react'
import { Typography, useMediaQuery } from '@mui/material'
import landscape from '../assets/logo/png/xxbridge.png'

import ImageWrapper from '../components/custom/ImageWrapper'
import StyledStack from '../components/custom/StyledStack'
import Login from '../components/User/Login'
import xxbridge from '@/components/custom/XXBridge'

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
        <StyledStack direction="column" spacing="50px" centerWidth centerHeight>
          <ImageWrapper src={landscape} alt="Logo with slogan" width="10%" />
          <Login />
        </StyledStack>
      )}
    </>
  )
}

export default ConnectPage
