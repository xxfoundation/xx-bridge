import React, { useCallback, useEffect } from 'react'
import { CircularProgress, NativeSelect, Stack } from '@mui/material'
import { AutorenewRounded } from '@mui/icons-material'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'

const shortenHash = (hash: string, size: number = 6): string =>
  `${hash.slice(0, size)}...${hash.slice(-size)}`

const truncateString = (str: string, length: number = 15): string =>
  str.length > length ? `${str.substring(0, length)}...` : str

const SubstrateWallet: React.FC = () => {
  const {
    loading,
    extensions,
    accounts,
    selectedAccount,
    connectWallet,
    selectAccount
  } = useAccounts()

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
    <Stack direction="row" gap="10px" alignItems="center">
      {extensions.length !== 0 && accounts.length > 0 ? (
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
