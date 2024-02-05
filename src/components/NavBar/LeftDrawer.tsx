import React, { useEffect, useMemo, useState } from 'react'
import {
  Divider,
  Drawer,
  DrawerProps,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  useMediaQuery
} from '@mui/material'
import { Home, Logout } from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'

// Files
import theme from '../../theme'
import logo from '../../assets/logo/png/xxbridge.png'
import { useNavBarContext } from '.'
import getStyles from './styles'
import Copyright from '../Footer/Copyright'

interface ListMenuElementsProps {
  menuList: string[]
  menuIcons: JSX.Element[]
  onClick: (text: string) => void
}

const ListMenuElements: React.FC<ListMenuElementsProps> = ({
  menuList,
  menuIcons,
  onClick
}) => {
  const [activePage, setActivePage] = useState<string>('Dashboard')
  const location = useLocation()
  const { pathname } = location

  useEffect(() => {
    // Extract the last part of the path (after the last '/')
    const pathParts = pathname.split('/')
    const path = pathParts[pathParts.length - 1]
    setActivePage(path)
  }, [pathname])

  return (
    <List>
      {menuList.map((text, index) => (
        <>
          <ListItem key={text} disablePadding>
            <ListItemButton
              onClick={() => {
                onClick(text)
                setActivePage(text)
              }}
              sx={{
                borderLeft:
                  activePage === text.toLowerCase() ? '2px solid' : '',
                borderLeftColor: 'primary.main'
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    activePage === text.toLowerCase() ? 'primary.main' : 'white'
                }}
              >
                {menuIcons[index]}
              </ListItemIcon>
              <ListItemText
                primary={text}
                sx={{
                  color:
                    activePage === text.toLowerCase() ? 'primary.main' : 'white'
                }}
              />
            </ListItemButton>
          </ListItem>
          {index === 1 && <Divider />}
        </>
      ))}
    </List>
  )
}

const LeftDrawer: React.FC = () => {
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))
  const {
    footerHeight,
    topBarHeight,
    drawerWidth,
    mobileOpen,
    handleDrawerToggle
  } = useNavBarContext()
  const { menuDrawer, menuDrawerHeader } = getStyles({
    footerHeight,
    topBarHeight,
    drawerWidth
  })

  const menuList = ['Bridge', 'LogOut']
  const menuIcons = [<Home key="home" />, <Logout key="logout" />]

  const drawerProps: DrawerProps = useMemo(
    () =>
      isMobile
        ? {
            variant: 'temporary',
            open: mobileOpen,
            onClose: handleDrawerToggle,
            ModalProps: {
              keepMounted: true
            },
            sx: menuDrawer
          }
        : {
            variant: 'permanent',
            sx: menuDrawer,
            open: true
          },
    [handleDrawerToggle, isMobile, menuDrawer, mobileOpen]
  )

  const handleMenuItemClick = (text: string) => {
    if (text === 'LogOut') {
      console.log('logout')
    } else navigate(`/${text.toLowerCase()}`)
  }

  return (
    <Drawer {...drawerProps}>
      <Stack sx={menuDrawerHeader}>
        <a href="https://xx.network/" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="logo" width="100%" />
        </a>
      </Stack>
      <Divider />
      <ListMenuElements
        menuList={menuList}
        menuIcons={menuIcons}
        onClick={handleMenuItemClick}
      />
      <Divider />

      <Copyright />
    </Drawer>
  )
}

export default LeftDrawer
