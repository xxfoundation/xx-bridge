import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { Loop } from '@mui/icons-material'
import { Currency } from '@/utils'

interface NetworkInfoProps {
  source: Currency
  dest: Currency
  setSwitching: () => void
}

const NetworkInfo: React.FC<NetworkInfoProps> = ({
  source,
  dest,
  setSwitching
}) => (
  <Stack
    direction="row"
    spacing={2}
    padding={4}
    alignItems="center"
    justifyContent="space-between"
  >
    <Stack direction="column" spacing={2}>
      <Typography sx={{ fontWeight: 'bold' }}>From</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <img
          src={source.symbol || 'https://via.placeholder.com/25'}
          width={25}
          height={25}
          style={{ borderRadius: '50%' }}
          alt="placeholder"
        />
        <Typography sx={{ fontWeight: 'bold' }}>{source.name}</Typography>
      </Stack>
    </Stack>
    <IconButton
      sx={{
        backgroundColor: 'primary.main',
        borderRadius: '50%',
        padding: '8px',
        width: '50px',
        height: '50px',
        '&:hover': {
          backgroundColor: 'primary.dark'
        }
      }}
      onClick={setSwitching}
    >
      <Tooltip title="Switch Networks" arrow placement="top">
        <Loop sx={{ color: 'primary.contrastText' }} />
      </Tooltip>
    </IconButton>
    <Stack direction="column" spacing={2}>
      <Typography sx={{ fontWeight: 'bold' }}>To</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <img
          src={dest.symbol || 'https://via.placeholder.com/25'}
          width={25}
          height={25}
          style={{ borderRadius: '50%' }}
          alt="placeholder"
        />
        <Typography sx={{ fontWeight: 'bold' }}>{dest.name}</Typography>
      </Stack>
    </Stack>
  </Stack>
)

export default NetworkInfo
