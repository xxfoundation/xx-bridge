import * as React from 'react'
import LinearProgress, {
  LinearProgressProps
} from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

function LinearLoading(props: LinearProgressProps & { value: number }) {
  const { value } = props
  const val = Math.round(value)
  return (
    <Box sx={{ display: 'flex', width: '40%', alignItems: 'center' }}>
      <LinearProgress
        variant="indeterminate"
        color="primary"
        sx={{ width: '100%', mr: 2 }}
        {...props}
      />
      <Typography variant="h5" color="primary.main">
        {`${val}%`}
      </Typography>
    </Box>
  )
}

export default LinearLoading
