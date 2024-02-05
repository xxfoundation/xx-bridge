import React, { useCallback, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import NavBar from '../components/NavBar'
import StyledButton from '../components/Custom/StyledButton'
import StyledStack from '@/components/Custom/StyledStack'
import xxbridge from '@/components/Custom/XXBridge'

const Home: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false)

  const handleLogin = useCallback(() => {
    console.log('login')
    setLoggedIn(true)
  }, [])

  return (
    <>
      {!loggedIn ? (
        <StyledStack direction="column" centerWidth centerHeight>
          <Typography
            variant="h3"
            sx={{ color: 'primary.main', marginTop: '20px' }}
          >
            Welcome to {xxbridge}
          </Typography>
          <Stack
            direction="column"
            spacing={2}
            sx={{ margin: '40px 0 20px 0', alignItems: 'center' }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'primary.light',
                margin: '40px',
                textAlign: 'center'
              }}
            >
              {xxbridge} is a platform to exchange xx coins to wrapped xx ERC20
              tokens and vice-versa.
            </Typography>
          </Stack>

          <StyledButton onClick={handleLogin} sx={{ marginTop: '10px' }}>
            Login
          </StyledButton>
        </StyledStack>
      ) : (
        <NavBar />
      )}
    </>
  )
}

export default Home
