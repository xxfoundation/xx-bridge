import React, { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import ConnectPage from './pages/ConnectPage.tsx'
import NotFound from './pages/NotFound'
// Files
import Home from './pages/Home.tsx'
import Bridge from './pages/Bridge.tsx'

const RerouteToBridge: React.FC = () => {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/bridge', { replace: true })
  }, [navigate])
  return null
}

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
            <>
              <Home />
            </>
          }
        >
          <Route path="/" element={<RerouteToBridge />} />
          <Route path="/bridge" element={<Bridge />} />
        </Route>
      ) : (
        <Route path="/" element={<ConnectPage />} />
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRouter
