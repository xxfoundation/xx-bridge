import React from 'react'
import { AppBar, Toolbar, IconButton, useMediaQuery } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
// Files
import { useNavBarContext } from '..'
import getStyles from '../styles'
import Wallets from './Wallets'
import theme from '@/theme'
import xxBridgeLogo from '@/assets/logo/svg/xxbridge.svg'

const TopBar: React.FC = () => {
  const { footerHeight, topBarHeight, drawerWidth, handleDrawerToggle } =
    useNavBarContext()
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))
  const styles = getStyles({
    footerHeight,
    topBarHeight,
    drawerWidth,
    isMobile
  })
  const isDownLg = useMediaQuery(theme.breakpoints.down('laptop'))

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
        {isDownLg ? (
          <div />
        ) : (
          <img src={xxBridgeLogo} alt="logo" style={{ width: '100px' }} />
        )}

        <Wallets />
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
