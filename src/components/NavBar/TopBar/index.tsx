import React from 'react'
import { AppBar, Toolbar, IconButton } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
// Files
import { useNavBarContext } from '..'
import getStyles from '../styles'
import Web3Wallet from './Web3Wallet'

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
        <div />
        <Web3Wallet />
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
