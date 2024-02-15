import React, { useEffect } from 'react'
import { InputLabel, NativeSelect, Stack } from '@mui/material'
import { useAccount } from 'wagmi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'

const shortenHash = (hash: string, size: number = 6): string =>
  `${hash.slice(0, size)}...${hash.slice(-size)}`

const truncateString = (str: string, length: number = 15): string =>
  str.length > length ? `${str.substring(0, length)}...` : str

const Wallets: React.FC = () => {
  const { address } = useAccount()
  const { extensions, accounts, selectedAccount, selectAccount } = useAccounts()

  // Select account 0 if no account is selected
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      selectAccount(accounts[0].address)
    }
  }, [accounts, selectedAccount, selectAccount])

  return (
    <Stack direction="row" gap="10px" key={address} alignItems="center">
      {(extensions.length !== 0) && <>
        <NativeSelect
          value={selectedAccount?.address || ''}
          onChange={(e) => selectAccount(e.target.value)}
        >
          {accounts.map((account) => (
            <option key={account.address} value={account.address}>
              {truncateString(account.meta.name || 'No name') + " (" + shortenHash(account.address) + ")"}
            </option>
          ))}
        </NativeSelect>
      </>}
      {(extensions.length === 0) && <div>No wallet extension found</div>}
      <div
        onClick={() => {
          const modal = document.querySelector('body > w3m-modal:nth-child(5)')
          if (modal) {
            ;(modal as HTMLElement).style.zIndex = '10000'
            ;(modal as HTMLElement).style.backgroundColor = 'rgb(0,0,0,0.7)'
          }

          const router = modal?.shadowRoot?.querySelector('w3m-router')
          const accountView =
            router?.shadowRoot?.querySelector('w3m-account-view')
          const listItem = accountView?.shadowRoot?.querySelector(
            'wui-flex:nth-child(2) > wui-list-item:nth-child(2)'
          )

          if (listItem) {
            ;(listItem as HTMLElement).style.display = 'none'
          }
        }}
      >
        <w3m-account-button />
      </div>
    </Stack>
  )
}

export default Wallets
