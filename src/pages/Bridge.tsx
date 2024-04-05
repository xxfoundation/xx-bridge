import React, { useCallback, useState } from 'react'
import { Divider, Stack, Typography, useMediaQuery } from '@mui/material'
import StyledStack from '../components/custom/StyledStack.tsx'
import NetworkInfo from '../components/Bridge/NetworkInfo'
import Loading from '@/components/Utils/Loading.tsx'
import ETHToXX from '@/components/Bridge/ETHToXX.tsx'
import XXToETH from '@/components/Bridge/XXToETH.tsx'
import { ethereumMainnet, xxNetwork } from '@/consts.ts'
import theme from '@/theme.ts'
import useSessionStorage from '@/hooks/useSessionStorage.ts'

const Bridge: React.FC = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))
  const [switching, setSwitching] = useState<boolean>(false)
  const [fromXX, setFromXX] = useSessionStorage<boolean>('fromNative', false)

  // Switch networks
  const switchNetworks = useCallback(() => {
    setSwitching(true)
    setTimeout(() => {
      setFromXX(!fromXX)
      setSwitching(false)
    }, 2000)
  }, [fromXX])

  return (
    <StyledStack
      direction="column"
      margin="auto"
      width={isMobile ? '90%' : '80%'}
      height="auto"
      centerWidth
      centerHeight
    >
      {switching ? (
        <Stack
          direction="column"
          spacing={2}
          padding={5}
          alignItems="center"
          sx={{ height: '100vh' }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Switching Networks
          </Typography>
          <Loading size="sm2" />
        </Stack>
      ) : (
        <Stack
          sx={{
            width: 'inherit',
            height: 'inherit',
            backgroundColor: 'background.dark',
            borderRadius: '18px'
          }}
        >
          <NetworkInfo
            source={fromXX ? xxNetwork : ethereumMainnet}
            dest={fromXX ? ethereumMainnet : xxNetwork}
            setSwitching={switchNetworks}
          />
          <Divider />
          {fromXX ? <XXToETH /> : <ETHToXX />}
        </Stack>
      )}
    </StyledStack>
  )
}

export default Bridge
