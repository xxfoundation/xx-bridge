import React, { useEffect, useMemo } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect, useNetwork } from 'wagmi'
import ConnectPage from './pages/ConnectPage.tsx'
import NotFound from './pages/NotFound'
// Files
import Bridge from './pages/Bridge.tsx'
import NavBar from './components/NavBar/index.tsx'
import {
  supportedNetworkIds,
  useSwitchToSupportedNetwork
} from './hooks/useWagmi.ts'
import { localConfig } from './plugins/wagmi.tsx'
import Loading from './components/Utils/Loading.tsx'

const AppRouter: React.FC = () => {
  const navigate = useNavigate()
  const { isConnected, connector, address } = useAccount()
  const { chain } = useNetwork()
  const { disconnect } = useDisconnect()
  const { isLoading, trigger, error } = useSwitchToSupportedNetwork()

  const inSupportedNetwork = useMemo(
    () => chain && supportedNetworkIds.map(elem => elem.id).includes(chain.id),
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
      trigger(localConfig.id)
    }
  }, [inSupportedNetwork, trigger, localConfig.id, chain, supportedNetworkIds])

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
