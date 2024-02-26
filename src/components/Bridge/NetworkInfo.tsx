import { Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { Loop } from '@mui/icons-material'
import { Network } from '@/utils'

interface NetworkInfoProps {
  source: Network
  dest: Network
  setSwitching: () => void
}

const NetworkInfo: React.FC<NetworkInfoProps> = ({
  source,
  dest,
  setSwitching
}) => (
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

export default NetworkInfo
