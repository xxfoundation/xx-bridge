// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import type { InjectedAccountWithMeta, InjectedExtension } from '@polkadot/extension-inject/types';
import { web3AccountsSubscribe, web3Enable } from '@polkadot/extension-dapp';
import { WithChildren } from '../types';
import AccountsContext, { AccountsContextType } from './AccountsContext';

const AccountsProvider: FC<WithChildren> = ({ children }) => {
  // Loading
  const [loading, setLoading] = useState(true);
  // Extensions
  const [extensions, setExtensions] = useState<InjectedExtension[]>([]);
  // Subscribed
  const [subscribed, setSubscribed] = useState(false);
  // Accounts
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);

  // Selected account
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta>();

  // Load extensions
  useEffect(() => {
    web3Enable('xx bridge').then((extensions) => {
      if (extensions.length === 0) {
        console.log('no extensions');
      }
      setExtensions(extensions);
      setLoading(false);
    });
  }, []);

  // Subscribe to account changes
  useEffect(() => {
    if (!subscribed && extensions !== undefined) {
      web3AccountsSubscribe(setAccounts, { ss58Format: 55 }).catch((err) => {
        console.error(err);
      });
      setSubscribed(true);
    }
  }, [subscribed, extensions]);

  // Select an account by address
  const selectAccount = useCallback((address: string) => {
    const account = accounts.find((a) => a.address === address);
    setSelectedAccount(account);
  }, [accounts]);

  // Get the signer for the current selected account
  //
  // Caches the function when accounts update.
  const getSigner = useCallback(() => {
    if (selectedAccount && extensions.length > 0 && accounts.length > 0) {
      const acct = accounts.find((a) => a.address === selectedAccount.address);
      if (acct) {
        // Find signer in extensions
        const ext = extensions.find((e) => e.name === acct.meta.source);
        return ext?.signer;
      }
    }
  }, [accounts, extensions, selectedAccount]);

  const context = useMemo<AccountsContextType>(
    () => ({
      loading,
      extensions,
      accounts,
      selectedAccount,
      selectAccount,
      getSigner
    }),
    [loading, extensions, accounts, getSigner]
  );

  return <AccountsContext.Provider value={context}>{children}</AccountsContext.Provider>;
};

export default AccountsProvider;