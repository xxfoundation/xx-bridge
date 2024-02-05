import React from 'react'
import { Typography } from '@mui/material'

const Title: React.FC<{ value: string }> = ({ value }) => (
  <Typography
    variant="h5"
    sx={{
      color: 'text.primary',
      margin: '15px 0',
      fontWeight: 'bold'
    }}
  >
    {value}
  </Typography>
)

export default Title
