import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Alert, CircularProgress, Stack, Typography } from '@mui/material'
import StyledButton from '../Custom/StyledButton'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import { ethereumMainnet, xxNetwork } from '@/consts'
import { WalletSelector } from '../NavBar/TopBar/Wallets'

const ConnectedButton: React.FC<{
  loading?: boolean
  isDisabled?: boolean
  handleClick: () => void
}> = ({ loading, isDisabled, handleClick }) => (
  <StyledButton
    sx={{
      fontSize: '12px',
      boxShadow: '0px 2px 5px rgba(105, 105, 105, 1)'
    }}
    onClick={handleClick}
    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
    disabled={isDisabled}
  >
    {isDisabled ? 'Connected' : 'Connect Wallet'}
  </StyledButton>
)

const ConnectedAccount: React.FC<{
  network: any
  address: string
  connectButton?: ReactNode
  xxWalletSelector?: ReactNode
}> = ({ network, address, connectButton, xxWalletSelector }) => (
  <Stack
    direction="row"
    spacing={2}
    justifyContent="space-between"
    alignItems="center"
  >
    <Stack direction="row" spacing={2}>
      {xxWalletSelector ? (
        <>{xxWalletSelector}</>
      ) : address ? (
        <div>{address}</div>
      ) : (
        <>{connectButton}</>
      )}
    </Stack>
    <img
      src={network.gasToken.symbol}
      width={30}
      height={30}
      style={{ borderRadius: '50%' }}
      alt={network.gasToken.name}
    />
  </Stack>
)

export const InfoTile: React.FC<{
  accounts: any
  selectedAccount: any
  selectAccount: any
  ethAddress: string
  loading?: boolean
  handleEthLogin: () => void
  handleXxLogin: () => void
  noXX?: boolean
}> = ({
  accounts,
  selectedAccount,
  selectAccount,
  ethAddress,
  loading,
  handleEthLogin,
  handleXxLogin,
  noXX = false
}) => (
  <Stack
    direction="column"
    spacing={2}
    sx={{
      borderRadius: '10px 10px 0 0',
      backgroundColor: '#999999',
      color: '#000000',
      padding: '20px',
      width: 'calc(100% - 40px)'
    }}
  >
    <ConnectedAccount
      network={ethereumMainnet}
      address={ethAddress}
      connectButton={<ConnectedButton handleClick={handleEthLogin} />}
    />
    {!noXX && (
      <ConnectedAccount
        network={xxNetwork}
        address={selectedAccount?.address || ''}
        connectButton={
          <ConnectedButton
            loading={loading}
            isDisabled={!!selectedAccount}
            handleClick={handleXxLogin}
          />
        }
        xxWalletSelector={
          accounts && accounts.length > 0 ? (
            <WalletSelector
              accounts={accounts}
              selectedAccount={selectedAccount}
              selectAccount={selectAccount}
            />
          ) : undefined
        }
      />
    )}
  </Stack>
)

const Login = () => {
  const { open } = useWeb3Modal()
  const {
    loading,
    error,
    accounts,
    selectedAccount,
    selectAccount,
    connectWallet
  } = useAccounts()

  const handleEthLogin = useCallback(async () => {
    await open()
  }, [open])

  const handleXxLogin = useCallback(async () => {
    await connectWallet()
    console.log('Connected wallet', error, selectedAccount, accounts)
  }, [connectWallet])

  useEffect(() => {
    console.log('Accounts', accounts)
    console.log('Selected account', selectedAccount)
  }, [accounts, selectedAccount])

  const displayErrorMessage = useMemo(() => {
    if (error) {
      return <div>{error}</div>
    }
    return null
  }, [error])

  return (
    <Stack
      direction="column"
      spacing="5px"
      sx={{ alignItems: 'center', width: '370px' }}
    >
      {/* <Stack
        direction="row"
        spacing="20px"
        width="90%"
        justifyContent="space-between"
      >
        <ConnectedButton
          loading={loading}
          isDisabled={!!selectedAccount}
          handleClick={handleXxLogin}
        />
        <ConnectedButton
          handleClick={handleEthLogin}
        />
      </Stack> */}
      <InfoTile
        accounts={accounts}
        selectedAccount={selectedAccount}
        selectAccount={selectAccount}
        ethAddress=""
        loading={loading}
        handleEthLogin={handleEthLogin}
        handleXxLogin={handleXxLogin}
        noXX
      />
      <Alert
        severity="info"
        sx={{
          padding: '0 10px',
          borderRadius: '0 0 10px 10px',
          backgroundColor: '#999999',
          color: '#fff',
          svg: {
            padding: '5px',
            color: '#fff'
          }
        }}
      >
        To use this bridge, you need to connect your Ethereum wallet. If you
        wish to convert XX to wrapped XX, you will also need to connect your XX
        wallet.
      </Alert>
      <Typography variant="body1" sx={{ color: 'red' }}>
        {displayErrorMessage}
      </Typography>
    </Stack>
  )
}

export default Login
