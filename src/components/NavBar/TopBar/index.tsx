import React from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Stack,
  useMediaQuery
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
// Files
import { useNavBarContext } from '..'
import getStyles from '../styles'
import Web3Wallet from './Web3Wallet'
import ButtonLink from '@/components/Custom/ButtonLink'
import StyledButton from '@/components/Custom/StyledButton'
import theme from '@/theme'

const TopBar: React.FC = () => {
  const { footerHeight, topBarHeight, drawerWidth, handleDrawerToggle } =
    useNavBarContext()
  const styles = getStyles({ footerHeight, topBarHeight, drawerWidth })
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))

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
        {!isMobile && (
          <Stack direction="row" spacing={7}>
            <ButtonLink
              text="xx network"
              onClick={() => window.open('https://xx.network/', '_blank')}
              noUnderline
            />
            <ButtonLink
              text="xx hub"
              onClick={() => window.open('https://hub.xx.network/', '_blank')}
              noUnderline
            />
            <ButtonLink
              text="xx wallet"
              onClick={() =>
                window.open('https://wallet.xx.network/', '_blank')
              }
              noUnderline
            />
            <StyledButton
              onClick={() => window.open('https://echoexx.tech/', '_blank')}
            >
              Echoexx
            </StyledButton>
          </Stack>
        )}
        <Web3Wallet />
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
