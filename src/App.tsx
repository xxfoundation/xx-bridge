import './App.css'

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { WagmiConfig } from 'wagmi'
import { init as initWagmi, wagmiConfig } from './plugins/wagmi.tsx'
import AppRouter from './AppRouter.tsx'
import AccountsProvider from './plugins/substrate/components/AccountsProvider.tsx'

// Initialize wagmi
try {
  console.log('[ECHOEXX]: Initializing wagmi...')
  initWagmi()
  console.log('[ECHOEXX]: wagmi initialized')
} catch (error) {
  console.error('[ECHOEXX]: wagmi initialization failed', error)
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
          <AccountsProvider>
            <AppRouter />
          </AccountsProvider>
        </BrowserRouter>
      </div>
    </div>
  </WagmiConfig>
)

export default App
