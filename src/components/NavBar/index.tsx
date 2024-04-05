import React, { createContext, useContext, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Stack, useMediaQuery } from '@mui/material'

// Files
import TopBar from './TopBar'
import LeftDrawer from './LeftDrawer'
import getStyles from './styles'
import Footer from '../Footer'
import theme from '@/theme'

const topBarHeight = '90px'
const drawerWidth = '240px'
const footerHeight = '90px'

const NavBarContext = createContext<{
  topBarHeight: string
  drawerWidth: string
  footerHeight: string
  mobileOpen: boolean
  handleDrawerToggle: () => void
}>(null as any)

export const useNavBarContext = () => {
  const ctx = useContext(NavBarContext)
  if (!ctx) {
    throw new Error(
      'useNavBarContext must be used within a NavBarContextProvider'
    )
  }
  return ctx
}

const NavBar: React.FC = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))
  const style = getStyles({ topBarHeight, drawerWidth, footerHeight, isMobile })
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const contextValue = useMemo(
    () => ({
      topBarHeight,
      drawerWidth,
      footerHeight,
      mobileOpen,
      handleDrawerToggle
    }),
    [footerHeight, mobileOpen]
  )

  return (
    <NavBarContext.Provider value={contextValue}>
      <Stack flexDirection="row">
        <LeftDrawer />
        <Stack flexDirection="column" sx={style.body}>
          <TopBar />
          <Box sx={style.outlet}>
            <Outlet />
          </Box>
          {!isMobile && <Footer sx={style.footer} />}
        </Stack>
      </Stack>
    </NavBarContext.Provider>
  )
}

export default NavBar
