import theme from '../../theme'

interface StyleParams {
  footerHeight: string
  drawerWidth: string
  topBarHeight: string
  isMobile: boolean
}

const getStyles = (styleParams: StyleParams) => ({
  body: {
    width: '100%',
    height: styleParams.isMobile ? '100%' : '100vh'
  },
  topBar: {
    position: 'fixed',
    right: 0,
    width: {
      mobile: '100%',
      tablet: '100%',
      desktop: '100%'
    },
    height: styleParams.topBarHeight,
    justifyContent: 'center',
    backgroundColor: theme.palette.background.paper
  },
  topBarHeader: {
    justifyContent: 'space-between',
    svg: {
      color: theme.palette.primary.contrastText
    }
  },
  topBarMenuButton: {
    marginRight: 2,
    display: { tablet: 'none' }
  },
  outlet: {
    width: {
      mobile: '100%',
      tablet: '100%',
      desktop: '100%'
    },
    // since topBar has position fixed we need to define margin-top
    marginTop: styleParams.topBarHeight,
    padding: '50px 0',
    height: `100%`,
    backgroundColor: theme.palette.background.paper
  },
  menuDrawer: {
    width: styleParams.drawerWidth,
    '& .MuiDrawer-paper': {
      maxHeight: `calc(100vh - ${styleParams.footerHeight})`,
      width: styleParams.drawerWidth,
      backgroundColor: theme.palette.background.dark
    }
  },
  menuDrawerHeader: {
    display: 'flex',
    justifyContent: 'center',
    margin: '10px',
    padding: '0 10px',
    height: `calc(${styleParams.topBarHeight} - 20px)`
  }
})

export default getStyles
