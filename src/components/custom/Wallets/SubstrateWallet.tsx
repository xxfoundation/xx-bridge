import React, { useCallback, useEffect } from 'react'
import {
  CircularProgress,
  NativeSelect,
  Skeleton,
  Stack,
  Tooltip
} from '@mui/material'
import { AutorenewRounded } from '@mui/icons-material'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import { NetworkLogo } from './Utils'
import { xxNetwork } from '@/consts'
import useSessionStorage from '@/hooks/useSessionStorage'
import { formatBalance } from '@/utils'
import useXxBalance from '@/hooks/useXxBalance'

const truncateString = (str: string, length: number = 15): string =>
  str.length > length ? `${str.substring(0, length)}...` : str

const BalanceDisplay: React.FC<{
  setIsLoadingBalance: boolean
  xxBalance: string
}> = ({ setIsLoadingBalance, xxBalance }) => (
  <Stack
    direction="row"
    gap="10px"
    sx={{
      padding: '10px',
      borderRadius: '10px',
      backgroundColor: 'background.grey',
      color: 'text.primary'
    }}
  >
    {setIsLoadingBalance ? (
      <Skeleton
        variant="text"
        width="40px"
        sx={{
          display: setIsLoadingBalance ? 'block' : 'none'
        }}
      />
    ) : (
      <>{xxBalance}</>
    )}
    <NetworkLogo network={xxNetwork} textSize />
  </Stack>
)

const SubstrateWallet: React.FC = () => {
  const {
    loading,
    extensions,
    accounts,
    selectedAccount,
    connectWallet,
    selectAccount
  } = useAccounts()

  const { isLoadingBalance, xxBalance } = useXxBalance()

  const [fromXX] = useSessionStorage('fromNative')

  const handleXxLogin = useCallback(async () => {
    await connectWallet()
  }, [connectWallet])

  // Select account 0 if no account is selected
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      selectAccount(accounts[0].address)
    }
  }, [accounts, selectedAccount, selectAccount])

  return (
    <Stack
      direction={fromXX ? 'row' : 'row-reverse'}
      gap="10px"
      alignItems="center"
    >
      {extensions.length !== 0 && accounts.length > 0 ? (
        <>
          {selectedAccount && selectedAccount.address && (
            <BalanceDisplay
              setIsLoadingBalance={isLoadingBalance}
              xxBalance={formatBalance(xxBalance.toString(), 9, 2)}
            />
          )}
          <Tooltip
            key={selectedAccount?.address}
            title={selectedAccount?.address || ''}
            sx={{
              fontSize: '0.9em',
              fontFamily: 'monospace'
            }}
          >
            <NativeSelect
              value={selectedAccount?.address || ''}
              onChange={e => selectAccount(e.target.value)}
              sx={{
                padding: '11px 10px',
                borderRadius: '10px',
                backgroundColor: 'background.grey',
                color: 'text.primary',
                select: {
                  padding: 0
                }
              }}
            >
              {accounts.map(account => (
                <option key={account.address} value={account.address}>
                  {`[${account.meta.source || '?'}] ${truncateString(account.meta.name || 'No name')}`}
                </option>
              ))}
            </NativeSelect>
          </Tooltip>
        </>
      ) : (
        <Stack direction="row" gap="10px" alignItems="center">
          <AutorenewRounded
            onClick={handleXxLogin}
            sx={{
              display: loading ? 'none' : 'block',
              borderRadius: '50%',
              padding: '5px',
              '&:hover': {
                backgroundColor: 'primary.main'
              }
            }}
          />
          <CircularProgress
            size={20}
            sx={{
              padding: '5px',
              display: loading ? 'block' : 'none'
            }}
          />
          {extensions.length !== 0 && accounts.length === 0 && (
            <div>Extension found, but no accounts connected</div>
          )}
          {extensions.length === 0 && <div>xx network wallet not found</div>}
        </Stack>
      )}
    </Stack>
  )
}

export default SubstrateWallet
