import { useCallback } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Stack } from '@mui/material'
import StyledButton from '../Custom/StyledButton'

const Login = () => {
  const { open } = useWeb3Modal()

  const handleLogin = useCallback(async () => {
    await open()
  }, [open])

  return (
    <Stack direction="column" spacing={4} sx={{ alignItems: 'center' }}>
      <StyledButton onClick={handleLogin}>Connect Wallet</StyledButton>
    </Stack>
  )
}

export default Login
