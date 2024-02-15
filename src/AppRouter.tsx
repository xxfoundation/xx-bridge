import React, { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import ConnectPage from './pages/ConnectPage.tsx'
import NotFound from './pages/NotFound'
// Files
import Bridge from './pages/Bridge.tsx'
import NavBar from './components/NavBar/index.tsx'
import AccountsProvider from './plugins/substrate/components/AccountsProvider.tsx'

const AppRouter: React.FC = () => {
  const navigate = useNavigate()
  const { isConnected, connector, address } = useAccount()

  useEffect(() => {
    if (!isConnected || connector === undefined) {
      navigate('/')
    }
  }, [navigate, isConnected, connector])

  return (
    <Routes>
      {isConnected && connector && address ? (
        <Route
          path="/"
          element={
            <AccountsProvider>
              <NavBar />
            </AccountsProvider>
          }
        >
          <Route path="/" element={<Bridge />} />
        </Route>
      ) : (
        <Route path="/" element={<ConnectPage />} />
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRouter
