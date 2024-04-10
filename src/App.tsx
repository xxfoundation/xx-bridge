import './App.css'

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { WagmiConfig } from 'wagmi'
import { ApolloProvider } from '@apollo/client'
import { Provider as ReduxProvider } from 'react-redux'
import { init as initWagmi, wagmiConfig } from './plugins/wagmi.tsx'
import AppRouter from './AppRouter.tsx'
import AccountsProvider from './plugins/substrate/components/AccountsProvider.tsx'
import ApiProvider from './plugins/substrate/components/ApiProvider.tsx'
import evmClient from './plugins/apollo/evm.ts'
import store from './plugins/redux/store.ts'

// Initialize wagmi
try {
  console.log('[BRIDGE]: Initializing wagmi...')
  initWagmi()
  console.log('[BRIDGE]: wagmi initialized')
} catch (error) {
  console.error('[BRIDGE]: wagmi initialization failed', error)
}

const App: React.FC = () => (
  <WagmiConfig config={wagmiConfig}>
    <div style={{ height: '100vh' }}>
      <div
        style={{
          height: `100vh`,
          width: '100vw'
        }}
      >
        <BrowserRouter>
          <ReduxProvider store={store}>
            <ApolloProvider client={evmClient}>
              <ApiProvider>
                <AccountsProvider>
                  <AppRouter />
                </AccountsProvider>
              </ApiProvider>
            </ApolloProvider>
          </ReduxProvider>
        </BrowserRouter>
      </div>
    </div>
  </WagmiConfig>
)

export default App
