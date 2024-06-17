import React, { useEffect, useMemo } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import ConnectPage from './pages/ConnectPage.tsx'
import NotFound from './pages/NotFound'
// Files
import Bridge from './pages/Bridge.tsx'
import NavBar from './components/NavBar/index.tsx'
import { useSwitchToSupportedNetwork } from './hooks/useWagmi.ts'
import { activeChain } from './plugins/wagmi.tsx'
import Loading from './components/Utils/Loading.tsx'

const AppRouter: React.FC = () => {
  const navigate = useNavigate()
  const { isConnected, chain, connector, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { isLoading, trigger, error } = useSwitchToSupportedNetwork()

  const inSupportedNetwork = useMemo(
    () => chain && chain.id === activeChain.id,
    [chain]
  )

  useEffect(() => {
    if (!isConnected || connector === undefined) {
      navigate('/')
    }
  }, [navigate, isConnected, connector])

  // trigger switch on chain change
  useEffect(() => {
    if (!inSupportedNetwork) {
      trigger(activeChain.id)
    }
  }, [inSupportedNetwork, trigger, activeChain.id, chain])

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
              {!inSupportedNetwork && isLoading ? (
                <Loading
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                  size="lg"
                >
                  Switching to supported network
                </Loading>
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
