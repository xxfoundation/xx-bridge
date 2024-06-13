import React, { useCallback, useEffect, useState } from 'react'
import { Divider, Stack, Typography, useMediaQuery } from '@mui/material'
import { useAccount } from 'wagmi'
import StyledStack from '../components/custom/StyledStack.tsx'
import NetworkInfo from '../components/Bridge/NetworkInfo'
import Loading from '@/components/Utils/Loading.tsx'
import ETHToXX from '@/components/Bridge/ETHToXX.tsx'
import XXToETH from '@/components/Bridge/XXToETH.tsx'
import { ethereumMainnet, xxNetwork } from '@/consts.ts'
import theme from '@/theme.ts'
import useSessionStorage from '@/hooks/useSessionStorage.ts'
import { getMarketvalue } from '@/utils.ts'

const priceFrequency = 2 * 60 * 1000 // 2 minutes

const Bridge: React.FC = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))
  const { address } = useAccount()
  const [switching, setSwitching] = useState<boolean>(false)
  const [fromXX, setFromXX] = useSessionStorage<boolean>('fromNative', false)
  const [accountChange, setAccountChange] = useState<boolean>(false)

  // TODO: Add account change listener and show modal if new account is not yet connected to the bridge
  // refresh page and pass by loading state when account changes
  useEffect(() => {
    setAccountChange(true)
    setTimeout(() => {
      setAccountChange(false)
    }, 1000)
  }, [address])

  // Switch networks
  const switchNetworks = useCallback(() => {
    setSwitching(true)
    setTimeout(() => {
      setFromXX(!fromXX)
      setSwitching(false)
    }, 2000)
  }, [fromXX])

  // Get ETH and XX prices in USD
  const [ethPrice, setEthPrice] = useState<string>()
  const [xxPrice, setXXPrice] = useState<string>()
  useEffect(() => {
    async function fetchPrices() {
      const priceEth = await getMarketvalue('ethereum')
      const priceXX = await getMarketvalue('xxcoin')
      console.log('ETH price:', priceEth)
      console.log('XX price:', priceXX)
      setEthPrice(priceEth)
      setXXPrice(priceXX)
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, priceFrequency)
    return () => clearInterval(interval)
  }, [])

  return (
    <StyledStack
      direction="column"
      margin="auto"
      width={isMobile ? '90%' : '80%'}
      height="auto"
      centerWidth
      centerHeight
    >
      {accountChange && (
        <Loading size="sm2">
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Account Changed
          </Typography>
        </Loading>
      )}
      {switching && (
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
      )}
      {!switching && !accountChange && (
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
          {fromXX ? (
            <XXToETH ethPrice={ethPrice} xxPrice={xxPrice} />
          ) : (
            <ETHToXX ethPrice={ethPrice} />
          )}
        </Stack>
      )}
    </StyledStack>
  )
}

export default Bridge
