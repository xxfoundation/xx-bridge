import theme from '../../theme'

interface StyleParams {
  footerHeight: string
  drawerWidth: string
  topBarHeight: string
}

const getStyles = (styleParams: StyleParams) => ({
  body: {
    height: `calc(100vh - ${styleParams.footerHeight})`
  },
  topBar: {
    position: 'fixed',
    right: 0,
    width: {
      mobile: '100%',
      tablet: `100%`
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
      mobile: '100vw',
      tablet: `100vw`
    },
    // since topBar has position fixed we need to define margin-top
    marginTop: styleParams.topBarHeight,
    padding: '50px 0',
    height: `calc(100vh - ${styleParams.topBarHeight} - ${styleParams.footerHeight})`,
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
