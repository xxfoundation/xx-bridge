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
import { useAppSelector, useAppDispatch } from '@/plugins/redux/hooks.ts'
import { actions, emptyState } from '@/plugins/redux/reducers.ts'
import { getTxFromAddress } from '@/plugins/redux/selectors.ts'
import { RootState } from '@/plugins/redux/types.ts'

const Bridge: React.FC = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))
  const { address } = useAccount()
  const [switching, setSwitching] = useState<boolean>(false)
  const [fromXX, setFromXX] = useSessionStorage<boolean>('fromNative', false)
  const [accountChange, setAccountChange] = useState<boolean>(false)

  // use redux
  const tx = useAppSelector(
    (state: RootState) =>
      (address && getTxFromAddress(state, address)) || emptyState.tx
  )
  const dispatch = useAppDispatch()

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
    dispatch(
      actions.setTxDetails({
        key: address,
        details: {
          ...tx,
          destinationAddress: ''
        }
      })
    )
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
          {fromXX ? <XXToETH /> : <ETHToXX />}
        </Stack>
      )}
    </StyledStack>
  )
}

export default Bridge
