import { Link, Typography } from '@mui/material'
import React from 'react'
import StyledStack from '../custom/StyledStack'

const Copyright: React.FC = () => (
  <StyledStack endHeight centerWidth>
    <Typography
      variant="body2"
      color="text"
      align="center"
      sx={{ padding: '20px 10px' }}
    >
      {'Copyright © '}
      <Link color="inherit" href="https://bitfashioned.com/">
        BitFashioned
      </Link>{' '}
      {new Date().getFullYear()}.
    </Typography>
  </StyledStack>
)

export default Copyright
