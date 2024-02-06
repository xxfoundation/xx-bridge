import {
  PaletteColorOptions,
  createTheme,
  responsiveFontSizes
} from '@mui/material'

const primaryColors: PaletteColorOptions = {
  main: '#08CCD6',
  light: '#dccB9c',
  dark: '#9a7a4c',
  contrastText: '#FFFFFF' // or '#333333'
}

const secondaryColors: PaletteColorOptions = {
  main: '#746129', // Main secondary color - darker, warm tone
  light: '#bd9f46', // Lighter shade of the secondary color
  dark: '#29220e', // Darker shade of the secondary color
  contrastText: '#000' // White contrast text for readability
}

const backgroundColors = {
  default: '#fff',
  paper: '#141416',
  dark: '#1D1C20',
  grey: '#2D2C30'
}

const theme1 = createTheme({
  breakpoints: {
    values: {
      mobile: 0,
      tablet: 640,
      laptop: 1024,
      desktop: 1200
    }
  },
  palette: {
    primary: {
      main: primaryColors.main,
      light: primaryColors.light,
      dark: primaryColors.dark,
      contrastText: primaryColors.contrastText
    },
    secondary: {
      main: secondaryColors.main,
      light: secondaryColors.light,
      dark: secondaryColors.dark,
      contrastText: secondaryColors.contrastText
    },
    background: {
      default: backgroundColors.default,
      paper: backgroundColors.paper,
      dark: backgroundColors.dark,
      grey: backgroundColors.grey
    },
    error: {
      main: '#4F1A25',
      light: '#DA2648'
    },
    info: {
      main: '#2196f3'
    },
    success: {
      main: '#4caf50'
    },
    text: {
      primary: '#A0A0A2',
      secondary: '#68676B'
    }
  },
  typography: {
    h1: {
      fontSize: '3.2em',
      lineHeight: 1.1
    },
    button: {
      fontStyle: 'bold',
      textTransform: 'uppercase'
    }
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          '&:hover': {
            color: '#CBB26B',
            textDecoration: 'underline'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: '1px solid transparent',
          padding: '0.6em 1.2em',
          fontWeight: 500,
          maxWidth: 'fit-content',
          cursor: 'pointer',
          transition: 'border-color 0.25s',
          '&:hover': {},
          '&:focus': {
            outline: 'none'
          },
          '&.Mui-focusVisible': {
            outline: 'none'
          },
          // disabled
          '&:disabled': {
            backgroundColor: '#cbb26b47',
            color: '#0000009c'
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: backgroundColors.grey,
          height: '0.2px',
          margin: '15px 0'
        }
      }
    }
  }
})

// Make the theme responsive
const theme = responsiveFontSizes(theme1)

export default theme
