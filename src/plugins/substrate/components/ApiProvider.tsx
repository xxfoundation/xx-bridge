import '@xxnetwork/types'

import { FC, useEffect, useCallback, useMemo, useState } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { TypeRegistry } from '@polkadot/types/create'
import { Box } from '@mui/material'
import ApiContext, { ApiContextType } from './ApiContext'
import Error from './Error'
import { WithChildren } from '../types'
import { XX_API_URL } from '@/consts'

const registry = new TypeRegistry()

const ApiProvider: FC<WithChildren> = ({ children }) => {
  const [error, setApiError] = useState<null | string>(null)
  const [api, setApi] = useState<ApiPromise>()
  const [connected, setConnected] = useState(false)
  const [ready, setIsReady] = useState(false)

  const onError = useCallback(
    (err: unknown): void => {
      console.error(err)

      setApiError((err as Error).message)
    },
    [setApiError]
  )

  // Connect to xx network blockchain
  useEffect(() => {
    if (!api) {
      console.log('Connecting to xx network blockchain')
      const provider = new WsProvider(XX_API_URL)
      setApi(
        new ApiPromise({
          provider,
          registry
        })
      )
    } else {
      console.log('API already initialized, connect should only be called once')
    }
  }, [api])

  useEffect(() => {
    if (api) {
      api.on('disconnected', () => setConnected(false))
      api.on('connected', () => setConnected(true))
      api.on('error', onError)
      api.on('ready', () => setIsReady(true))
    }
  }, [api, onError])

  const context = useMemo<ApiContextType>(
    () => ({
      api,
      connected,
      ready,
      error
    }),
    [api, connected, error, ready]
  )

  if (error) {
    return (
      <Box sx={{ p: 5, py: 10, textAlign: 'center' }}>
        <Error
          variant="body1"
          sx={{ fontSize: 24, pb: 5 }}
          message="Service currently unavailable. Please check your internet connectivity."
        />
      </Box>
    )
  }

  return <ApiContext.Provider value={context}>{children}</ApiContext.Provider>
}

export default ApiProvider
