import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
// import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import App from './App.tsx'
import theme from './theme'

const cache = createCache({
  key: 'css',
  prepend: true
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        {/* <CssBaseline /> */}
        <App />
      </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>
)
