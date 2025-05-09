// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import type {
  InjectedAccountWithMeta,
  InjectedExtension
} from '@polkadot/extension-inject/types'
import { web3AccountsSubscribe, web3Enable } from '@polkadot/extension-dapp'
import { WithChildren } from '../types'
import AccountsContext, { AccountsContextType } from './AccountsContext'
import { isValidXXNetworkAddress } from '@/utils'
import useSessionStorage from '@/hooks/useSessionStorage'

// Supported extensions
const supportedExtensions = ['polkadot-js', 'subwallet-js', 'talisman']

const AccountsProvider: FC<WithChildren> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | undefined>()
  const [extensions, setExtensions] = useState<InjectedExtension[]>([])
  const [hasExtensions, setHasExtensions] = useState<boolean>(false)
  const [subscribed, setSubscribed] = useState<boolean>(false)
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>()
  const [accounts, setAccounts] = useSessionStorage<InjectedAccountWithMeta[]>(
    'substrateAccounts',
    []
  )

  // Check if extensions are available on window load
  useEffect(() => {
    supportedExtensions.forEach(ext => {
      if ((window as any)?.injectedWeb3[ext]) {
        setHasExtensions(true)
      }
    })
  }, [])

  const subscribedAccounts = useCallback(
    (accs: InjectedAccountWithMeta[]) => {
      setAccounts(
        accs.filter(acc => isValidXXNetworkAddress(acc.address) && acc.meta)
      )
    },
    [accounts]
  )

  const connectWallet = useCallback(async () => {
    setLoading(true)
    try {
      const ext = await web3Enable('xx bridge')
      if (!ext) {
        throw new Error('No extensions found')
      }
      setExtensions(ext)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setLoading(false)
    }

    if (!subscribed) {
      web3AccountsSubscribe(subscribedAccounts, { ss58Format: 55 }).catch(
        err => {
          console.error(err)
        }
      )
      setSubscribed(true)
    }
    setLoading(false)
  }, [subscribed, subscribedAccounts])

  // Enable extention providers on load if already connected (e.g. page refresh)
  useEffect(() => {
    // Accounts state variable persists in session storage on page refresh, hence verify if accounts are already present in state to avoid connecting to wallet if user did not previously connected to wallet - manual connect is required
    if (!loading && accounts.length > 0 && extensions.length === 0) {
      connectWallet()
    }
  }, [loading, accounts, extensions, connectWallet])

  // Select an account by address
  const selectAccount = useCallback(
    (address: string) => {
      const account = accounts.find(a => a.address === address)
      setSelectedAccount(account)
    },
    [accounts]
  )

  // Select the first account if no account is selected
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0])
    }
  }, [accounts, selectedAccount])

  // Get the signer for the current selected account
  // Caches the function when accounts update.
  const getSigner = useCallback(() => {
    if (selectedAccount && extensions.length > 0 && accounts.length > 0) {
      const acct = accounts.find(a => a.address === selectedAccount.address)
      if (acct) {
        // Find signer in extensions
        const ext = extensions.find(e => e.name === acct.meta.source)
        return ext?.signer
      }
    }
    return undefined
  }, [accounts, extensions, selectedAccount])

  const context = useMemo<AccountsContextType>(
    () => ({
      loading,
      error,
      extensions,
      hasExtensions,
      accounts,
      selectedAccount,
      selectAccount,
      getSigner,
      connectWallet
    }),
    [
      loading,
      error,
      extensions,
      hasExtensions,
      accounts,
      selectedAccount,
      selectAccount,
      getSigner,
      connectWallet
    ]
  )

  return (
    <AccountsContext.Provider value={context}>
      {children}
    </AccountsContext.Provider>
  )
}

export default AccountsProvider
