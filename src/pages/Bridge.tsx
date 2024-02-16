import React, { useCallback, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import StyledStack from '../components/Custom/StyledStack'
import NetworkInfo from '../components/Bridge/NetworkInfo'
import { Network } from '@/utils'
import ApiProvider from '../plugins/substrate/components/ApiProvider.tsx'
import Loading from '@/components/Utils/Loading.tsx'
import ETHToXX from '@/components/Bridge/ETHToXX.tsx'
import XXToETH from '@/components/Bridge/XXToETH.tsx'
import { ethereumMainnet, xxNetwork } from '@/consts.ts'

const Bridge: React.FC = () => {
  const [source, setSource] = useState<Network>(ethereumMainnet)
  const [dest, setDest] = useState<Network>(xxNetwork)
  const [switching, setSwitching] = useState<boolean>(false)
  const [fromXX, setFromXX] = useState<boolean>(false)

  // Switch networks
  const switchNetworks = useCallback(() => {
    setSwitching(true)
    setTimeout(() => {
      setFromXX(!fromXX)
      setSource(dest)
      setDest(source)
      setSwitching(false)
    }, 2000)
  }, [fromXX, source, dest])

  return (
    <ApiProvider>
      <StyledStack direction="column" spacing="40px" centerWidth centerHeight>
        <Stack spacing={6}>
          {!switching && (
            <>
              <Stack
                sx={{
                  width: '640px',
                  backgroundColor: 'background.dark',
                  borderRadius: '18px'
                }}
              >
                <NetworkInfo
                  source={source}
                  dest={dest}
                  setSwitching={switchNetworks}
                />
              </Stack>
              {fromXX ? <XXToETH /> : <ETHToXX />}
            </>
          )}
          {switching && (
            <Stack
              direction="column"
              spacing={2}
              padding={5}
              alignItems="center"
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Switching Networks
              </Typography>
              <Loading size="sm2" />
            </Stack>
          )}
        </Stack>
      </StyledStack>
    </ApiProvider>
  )
}

export default Bridge
