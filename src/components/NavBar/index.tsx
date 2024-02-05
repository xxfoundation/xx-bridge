import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Stack } from '@mui/material'

// Files
import { useAccount } from 'wagmi'
import TopBar from './TopBar'
import LeftDrawer from './LeftDrawer'
import getStyles from './styles'
import useLocalStorage from '@/hooks/useLocalStorage'

const topBarHeight = '90px'
const drawerWidth = '240px'
const footerHeight = '0px'

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
  const { address } = useAccount()
  const [loggedInAddress] = useLocalStorage<string>('loggedInAddress')
  const style = getStyles({ topBarHeight, drawerWidth, footerHeight })
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  useEffect(() => {
    // This will run when `address` or `isConnected` changes
    if (loggedInAddress && loggedInAddress !== address) {
      console.log(`Account changed from ${loggedInAddress} to ${address}`)
      console.log('Logging out...')
    }
  }, [address, loggedInAddress])

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
        </Stack>
      </Stack>
    </NavBarContext.Provider>
  )
}

export default NavBar
