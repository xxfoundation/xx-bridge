import React, { Fragment, useMemo } from 'react'
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
import { Home, Hub, Message, Wallet } from '@mui/icons-material'

// Files
import theme from '../../theme'
import logo from '../../assets/logo/png/xxbridge.png'
import { useNavBarContext } from '.'
import getStyles from './styles'
import FooterMobile from '../Footer/FooterMobile'

interface ListMenuElementsProps {
  menuList: string[]
  menuIcons: JSX.Element[]
  onClick: (text: string) => void
}

const ListMenuElements: React.FC<ListMenuElementsProps> = ({
  menuList,
  menuIcons,
  onClick
}) => (
  <List>
    {menuList.map((text, index) => (
      <Fragment key={text}>
        <ListItem key={text} disablePadding>
          <ListItemButton
            onClick={() => {
              onClick(text)
            }}
          >
            <ListItemIcon
              sx={{
                color: 'white'
              }}
            >
              {menuIcons[index]}
            </ListItemIcon>

            <ListItemText
              primary={text}
              sx={{
                color: 'white',
                fontStyle: index === 3 ? 'italic' : 'normal'
              }}
            />
          </ListItemButton>
        </ListItem>
        {index === 2 && <Divider />}
      </Fragment>
    ))}
  </List>
)

const LeftDrawer: React.FC = () => {
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
    drawerWidth,
    isMobile
  })

  const menuList = ['xx network', 'xx wallet', 'xx hub', 'echoexx.tech']
  const menuIcons = [
    <Home key="home" />,
    <Wallet key="wallet" />,
    <Hub key="home" />,
    <Message key="message" />
  ]

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
            display: 'none'
          },
    [handleDrawerToggle, isMobile, menuDrawer, mobileOpen]
  )

  const handleMenuItemClick = (text: string) => {
    switch (text) {
      case 'xx network':
        window.open('https://xx.network/', '_blank')
        break
      case 'xx wallet':
        window.open('https://wallet.xx.network/', '_blank')
        break
      case 'xx hub':
        window.open('https://hub.xx.network/', '_blank')
        break
      case 'echoexx':
        window.open('https://echoexx.tech/', '_blank')
        break
      default:
        break
    }
  }

  return (
    <Drawer {...drawerProps}>
      <Stack sx={menuDrawerHeader} alignItems="center">
        <a href="https://xx.network/" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="logo" width="150px" />
        </a>
      </Stack>
      <Divider sx={{ marginTop: '0px' }} />
      <ListMenuElements
        menuList={menuList}
        menuIcons={menuIcons}
        onClick={handleMenuItemClick}
      />
      <Divider />

      <FooterMobile />
    </Drawer>
  )
}

export default LeftDrawer
