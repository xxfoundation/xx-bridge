import React from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
  Stack
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
// Files
import { useNavBarContext } from '..'
import getStyles from '../styles'
import theme from '@/theme'
import xxBridgeLogo from '@/assets/logo/svg/xxbridge.svg'
import SubstrateWallet from '../../custom/Wallets/SubstrateWallet'
import EvmWallet from '@/components/custom/Wallets/EvmWallet'
import useSessionStorage from '@/hooks/useSessionStorage'
import { MobileWalletsDisplay } from '@/components/custom/Wallets/Utils'

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
  const [fromXX] = useSessionStorage<boolean>('fromNative')

  return (
    <AppBar sx={styles.topBar}>
      <Toolbar
        sx={{
          ...styles.topBarHeader,
          flexDirection: isMobile ? 'row' : fromXX ? 'row-reverse' : 'row'
        }}
      >
        {!isMobile && <EvmWallet disconnectButton />}
        <Stack direction="row">
          {isMobile && (
            <IconButton edge="start" onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
          )}
          <img
            src={xxBridgeLogo}
            alt="logo"
            style={
              isMobile
                ? {
                    display: 'flex',
                    width: '100px'
                  }
                : (styles.topBarLogo as any)
            }
          />
        </Stack>
        {!isMobile && <SubstrateWallet />}
        {isMobile && <MobileWalletsDisplay />}
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
