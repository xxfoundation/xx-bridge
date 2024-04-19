import { Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { Loop } from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useEffect, useMemo } from 'react'
import { Network } from '@/utils'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import { getTxFromAddress } from '@/plugins/redux/selectors'
import { useAppDispatch, useAppSelector } from '@/plugins/redux/hooks'
import { RootState } from '@/plugins/redux/types'
import { actions } from '@/plugins/redux/reducers'

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
  const { selectedAccount } = useAccounts()
  const dispatch = useAppDispatch()

  // set account based on network
  const account = useMemo(() => {
    if (source.name === 'xx network') {
      return selectedAccount?.address
    }
    return address
  }, [address, selectedAccount, source])

  // use redux
  const transactions = useAppSelector((state: RootState) => state.transactions)
  const tx = useAppSelector(
    (state: RootState) => account && getTxFromAddress(state, account)
  )

  // check if transfer is in progress
  const startTransfer = useMemo(() => !!(tx && tx.status.step > 0), [tx])

  // Initialize redux state for account
  useEffect(() => {
    if (account) {
      if (Object.prototype.hasOwnProperty.call(transactions, account)) {
        console.log('Key already exists', account)
        return
      }
      dispatch(actions.newKey(account))
    }
  }, [account])

  return (
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
  )
}

export default NetworkInfo
