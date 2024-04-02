import React from 'react'
import type {
  InjectedAccountWithMeta,
  InjectedExtension
} from '@polkadot/extension-inject/types'
import { Signer } from '@polkadot/api/types'
import { BN } from '@polkadot/util'

export type AccountsContextType = {
  loading: boolean
  error: string | undefined
  extensions: InjectedExtension[]
  accounts: InjectedAccountWithMeta[]
  selectedAccount?: InjectedAccountWithMeta
  selectAccount: (address: string) => void
  getSigner(): Signer | undefined
  connectWallet(): Promise<void>
  isLoadingBalance: boolean
  xxBalance: BN
}

const AccountsContext: React.Context<AccountsContextType> = React.createContext(
  {} as unknown as AccountsContextType
)

const AccountsProvider: React.Provider<AccountsContextType> =
  AccountsContext.Provider

export default AccountsContext

export { AccountsProvider }
