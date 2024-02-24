import React from 'react'
import { AppBar, Toolbar, IconButton, Typography } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
// Files
import { useNavBarContext } from '..'
import getStyles from '../styles'
import Wallets from './Wallets'

const TopBar: React.FC = () => {
  const { footerHeight, topBarHeight, drawerWidth, handleDrawerToggle } =
    useNavBarContext()
  const styles = getStyles({ footerHeight, topBarHeight, drawerWidth })

  return (
    <AppBar sx={styles.topBar}>
      <Toolbar sx={styles.topBarHeader}>
        <IconButton
          edge="start"
          onClick={handleDrawerToggle}
          sx={styles.topBarMenuButton}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" marginLeft={5}>
          xx Bridge
        </Typography>
        <Wallets />
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
