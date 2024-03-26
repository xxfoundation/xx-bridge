// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
  Unsubcall
} from '@polkadot/extension-inject/types'
import { web3AccountsSubscribe, web3Enable } from '@polkadot/extension-dapp'
import { WithChildren } from '../types'
import AccountsContext, { AccountsContextType } from './AccountsContext'
import { isValidXXNetworkAddress } from '@/utils'
import useSessionStorage from '@/hooks/useSessionStorage'

const AccountsProvider: FC<WithChildren> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | undefined>()
  const [extensions, setExtensions] = useState<InjectedExtension[]>([])
  const [subscribed, setSubscribed] = useState(false)
  const accountsUnsubscriber = useRef<Unsubcall>()
  const [accounts, setAccounts] = useSessionStorage<InjectedAccountWithMeta[]>(
    'substrateAccounts',
    []
  )

  // Selected account
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>()

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
      web3AccountsSubscribe(subscribedAccounts, { ss58Format: 55 })
        .then(res => {
          accountsUnsubscriber.current = res
        })
        .catch(err => {
          console.error(err)
        })
      setSubscribed(true)
    }
    setLoading(false)
  }, [subscribed, subscribedAccounts])

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
  //
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
