import { Box } from '@mui/material'
import React from 'react'
import Copyright from './Copyright'
import getStyles from './styles'

const Footer: React.FC<{ footerHeight: string }> = ({ footerHeight }) => {
  const style = getStyles({ footerHeight })
  return (
    <Box sx={style.footer}>
      <Copyright />
    </Box>
  )
}

export default Footer
