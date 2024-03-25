import React, { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import ConnectPage from './pages/ConnectPage.tsx'
import NotFound from './pages/NotFound'
// Files
import Bridge from './pages/Bridge.tsx'
import NavBar from './components/NavBar/index.tsx'
import { useSwitchToSupportedNetwork } from './hooks/useWagmi.ts'
import { localConfig } from './plugins/wagmi.tsx'
import Loading from './components/Utils/Loading.tsx'

const AppRouter: React.FC = () => {
  const navigate = useNavigate()
  const { isConnected, connector, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { isLoading, trigger, error } = useSwitchToSupportedNetwork()

  useEffect(() => {
    if (!isConnected || connector === undefined) {
      navigate('/')
    }
    if (isConnected && connector && address) {
      console.log('triggering switch')
      trigger(localConfig.id)
    }
  }, [navigate, isConnected, connector])

  useEffect(() => {
    if (error) {
      disconnect()
    }
  }, [error])

  return (
    <Routes>
      {isConnected && connector && address && !error ? (
        <Route
          path="/"
          element={
            <>
              {isLoading ? (
                <Loading
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                  size="lg"
                />
              ) : (
                <NavBar />
              )}
            </>
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
