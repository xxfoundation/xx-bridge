import {
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { Loop } from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { Network } from '@/utils'
import useSessionStorage from '@/hooks/useSessionStorage'
import useLocalStorage from '@/hooks/useLocalStorage'

const Banner: React.FC = () => {
  const { address } = useAccount()
  const [depositTxHash] = useLocalStorage<string>(`depositTxHash-${address}`)

  return (
    <>
      {address && depositTxHash && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            backgroundColor: 'primary.dark',
            color: 'white',
            padding: '10px',
            borderRadius: '10px 10px 0 0'
          }}
        >
          <Stack direction="row" alignItems="center">
            <Stack direction="column" alignItems="flex-start">
              <span>Network: Ethereum</span>
              <span>Chain ID: 1</span>
            </Stack>
          </Stack>
          <Link
            href={`https://etherscan.io/tx/${depositTxHash}`}
            target="_blank"
          >
            View on Etherscan &rarr; {depositTxHash.slice(0, 6)}...
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
  const [startTransfer] = useSessionStorage<boolean>(`transfer-${address}`)
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
