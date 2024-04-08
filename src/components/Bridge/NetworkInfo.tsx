import {
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { Loop } from '@mui/icons-material'
import { useAccount, useWaitForTransaction } from 'wagmi'
import { useEffect, useMemo } from 'react'
import { useSubscription } from '@apollo/client'
import { Network } from '@/utils'
import useLocalStorage from '@/hooks/useLocalStorage'
import xxClient from '@/plugins/apollo/xx'
import {
  SUB_BRIDGE_EVENTS,
  SUB_DEPOSIT_NONCE,
  SubBridgeEvents,
  SubDepositNonce
} from '@/plugins/apollo/schemas'
import { BRIDGE_ID_ETH_MAINNET } from '@/consts'

const Banner: React.FC = () => {
  const { address } = useAccount()
  const [depositTxHash, setDepositTxHash] = useLocalStorage<string>(
    `depositTxHash-${address}`
  )

  const txHash = useMemo(() => depositTxHash || '', [depositTxHash])

  // Check if tx executed
  // If it failed then need to clear deposit
  const { data, isLoading } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    confirmations: 3
  })

  // Get on-chain deposit nonce
  const { data: depositNonce, loading: depositLoading } =
    useSubscription<SubDepositNonce>(SUB_DEPOSIT_NONCE, {
      variables: {
        where: {
          txn_hash: { _eq: txHash }
        }
      }
    })

  // process deposit nonce
  const dataEvent = useMemo(() => {
    if (depositNonce && depositNonce.deposit.length > 0) {
      return `[${BRIDGE_ID_ETH_MAINNET},${depositNonce.deposit[0].nonce}]`
    }
    return ''
  }, [depositNonce])

  // Watch executed event on Bridge smart contract (xx indexer)
  const { data: bridgeEvent, loading: bridgeLoading } =
    useSubscription<SubBridgeEvents>(SUB_BRIDGE_EVENTS, {
      client: xxClient,
      variables: {
        where: {
          _and: [
            { module: { _eq: 'chainBridge' } },
            { call: { _eq: 'ProposalSucceeded' } },
            { data: { _eq: dataEvent } }
          ]
        }
      }
    })

  // Clear deposit hash on successful bridge event OR failed transaction
  useEffect(() => {
    // Failed tx
    if (!isLoading && data && data.status !== 'success') {
      setDepositTxHash('')
    }
    // Bridge event
    if (!bridgeLoading && bridgeEvent && bridgeEvent.event.length > 0) {
      setDepositTxHash('')
    }
  }, [data, isLoading, bridgeEvent, bridgeLoading])

  // Should banner be shown?
  const bannerShown = useMemo(
    () =>
      !!address &&
      !!depositTxHash &&
      !isLoading &&
      !depositLoading &&
      data &&
      data.status === 'success' &&
      !bridgeLoading &&
      bridgeEvent &&
      bridgeEvent.event.length === 0,
    [
      address,
      depositTxHash,
      isLoading,
      data,
      depositLoading,
      bridgeLoading,
      bridgeEvent
    ]
  )

  return (
    <>
      {bannerShown && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            backgroundColor: 'primary.dark',
            color: 'white',
            padding: '20px',
            borderRadius: '10px 10px 0 0'
          }}
        >
          <span>Bridge transfer ongoing...</span>
          <span>Ethereum &rarr; xx network</span>
          <Link
            href={`https://etherscan.io/tx/${depositTxHash}`}
            target="_blank"
          >
            See on Etherscan
          </Link>
        </Stack>
      )}
    </>
  )
}

interface NetworkInfoProps {
  source: Network
  dest: Network
  setSwitching: () => void
}

const NetworkInfo: React.FC<NetworkInfoProps> = ({
  source,
  dest,
  setSwitching
}) => {
  const { address } = useAccount()
  const [startTransfer] = useLocalStorage<boolean>(`transfer-${address}`)
  return (
    <>
      <Banner />
      <Grid container p="20px">
        <Grid item mobile={5}>
          <Typography fontWeight="bold" textAlign="left" marginBottom="5px">
            From
          </Typography>
          <Stack direction="row" spacing={1} alignSelf="flex-start">
            <img
              src={source.gasToken.symbol || 'https://via.placeholder.com/25'}
              width={25}
              height={25}
              style={{ borderRadius: '50%' }}
              alt="placeholder"
            />
            <Typography variant="body2" margin="auto 0.5em !important">
              {source.name}
            </Typography>
          </Stack>
        </Grid>
        <Grid item mobile={2} textAlign="center" margin="auto">
          <IconButton
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              padding: '8px',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
            disabled={startTransfer}
            onClick={setSwitching}
          >
            <Tooltip title="Switch Networks" arrow placement="top">
              <Loop sx={{ color: 'primary.contrastText' }} />
            </Tooltip>
          </IconButton>
        </Grid>
        <Grid item mobile={5}>
          <Typography fontWeight="bold" textAlign="right" marginBottom="5px">
            To
          </Typography>
          <Stack
            direction="row-reverse"
            width="100%"
            spacing={1}
            justifyContent="right"
          >
            <img
              src={dest.gasToken.symbol || 'https://via.placeholder.com/25'}
              width={25}
              height={25}
              style={{ borderRadius: '50%' }}
              alt="placeholder"
            />
            <Typography variant="body2" margin="auto 0.5em !important">
              {dest.name}
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}

export default NetworkInfo
