import { Alert, Stack } from '@mui/material'
import { ConnectEthereumNetwork, walletStyles } from '../Custom/WalletUtils'

const Login = () => (
  <Stack
    direction="column"
    spacing="5px"
    sx={{ alignItems: 'center', width: '370px' }}
  >
    <Stack sx={walletStyles().stack}>
      <ConnectEthereumNetwork />
    </Stack>
    <Alert severity="info" sx={walletStyles().alert}>
      To use this bridge, you need to connect your Ethereum wallet. If you wish
      to convert XX to wrapped XX, you will also need to connect your XX wallet.
    </Alert>
  </Stack>
)

export default Login
