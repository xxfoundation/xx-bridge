import { CircularProgress, NativeSelect } from '@mui/material'
import { Stack } from '@mui/system'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useCallback } from 'react'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import { xxNetwork, ethereumMainnet } from '@/consts'
import StyledButton from './StyledButton'
import { truncateString, shortenHash } from '@/utils'

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */
export const walletStyles = () => ({
  stack: {
    flexDirection: 'column',
    gap: '10px',
    borderRadius: '10px 10px 0 0',
    backgroundColor: '#999999',
    color: '#000000',
    padding: '20px',
    width: 'calc(100% - 40px)'
  },
  alert: {
    padding: '0 10px',
    borderRadius: '0 0 10px 10px',
    backgroundColor: '#999999',
    color: '#fff',
    svg: {
      padding: '5px',
      color: '#fff'
    }
  }
})

/* -------------------------------------------------------------------------- */
/*                              Local Components                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                               Wallet Selector                              */
/* -------------------------------------------------------------------------- */
interface WalletSelectorParams {
  accounts: InjectedAccountWithMeta[]
  selectedAccount?: InjectedAccountWithMeta
  selectAccount: (address: string) => void
}

export const WalletSelector: React.FC<WalletSelectorParams> = ({
  accounts,
  selectedAccount,
  selectAccount
}) => (
  <NativeSelect
    value={selectedAccount?.address || ''}
    onChange={e => selectAccount(e.target.value)}
  >
    {accounts.map(account => (
      <option key={account.address} value={account.address}>
        {`${truncateString(account.meta.name || 'No name')} (${shortenHash(account.address)})`}
      </option>
    ))}
  </NativeSelect>
)

/* -------------------------------------------------------------------------- */
/*                            Substrate Components                            */
/* -------------------------------------------------------------------------- */

export const ConnectSubstrateNetwork: React.FC<{
  address: string
}> = ({ address }) => {
  const { open } = useWeb3Modal()
  const {
    loading,
    error,
    accounts,
    selectedAccount,
    selectAccount,
    connectWallet
  } = useAccounts()

  const handleLogin = useCallback(async () => {
    await connectWallet()
  }, [open])

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="space-between"
      alignItems="center"
    >
      {error && <div>{error}</div>}
      {!error && (
        <Stack direction="row" spacing={2}>
          {accounts && accounts.length && !selectedAccount ? (
            <WalletSelector
              accounts={accounts}
              selectedAccount={selectedAccount}
              selectAccount={selectAccount}
            />
          ) : selectedAccount ? (
            <div>{address}</div>
          ) : (
            <ConnectedButton
              loading={loading}
              isDisabled={!!selectedAccount}
              handleClick={handleLogin}
            />
          )}
        </Stack>
      )}
      <img
        src={xxNetwork.gasToken.symbol}
        width={30}
        height={30}
        style={{ borderRadius: '50%' }}
        alt={xxNetwork.gasToken.code}
      />
    </Stack>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Ethereum Components                            */
/* -------------------------------------------------------------------------- */
export const ConnectEthereumNetwork: React.FC = () => {
  const { open } = useWeb3Modal()

  const handleLogin = useCallback(async () => {
    await open()
  }, [open])

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="space-between"
      alignItems="center"
    >
      <Stack direction="row" spacing={2}>
        <ConnectedButton handleClick={handleLogin} />
      </Stack>
      <img
        src={ethereumMainnet.gasToken.symbol}
        width={30}
        height={30}
        style={{ borderRadius: '50%' }}
        alt={ethereumMainnet.gasToken.code}
      />
    </Stack>
  )
}
