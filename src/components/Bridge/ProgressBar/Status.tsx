import React from 'react'
import { Stack, Typography } from '@mui/material'
import TransferETHToXX from './ETHToXX'
import TransferXXToETH from './XXToETH'

interface StatusProps {
  sourceId: 0 | 1
  reset: () => void
}

const Status: React.FC<StatusProps> = ({ sourceId, reset }) => (
  <Stack
    sx={{
      marginTop: '10px',
      flexDirection: 'column',
      alignItems: 'center'
    }}
    spacing="20px"
  >
    <Typography variant="h5" fontWeight="bold">
      On-going Transfer Status
    </Typography>
    {sourceId === 1 ? (
      <TransferETHToXX reset={reset} />
    ) : (
      <TransferXXToETH reset={reset} />
    )}
  </Stack>
)

export default Status
