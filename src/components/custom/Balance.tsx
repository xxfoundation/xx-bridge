import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import React from 'react'

interface IBalanceProps {
  icon: string
  balance: React.ReactNode
  title: string
}

const Balance: React.FC<IBalanceProps> = ({ icon, balance, title }) => (
  <Stack
    sx={{
      backgroundColor: 'background.grey',
      padding: '5px',
      borderRadius: '8px',
      alignItems: 'center',
      gap: '5px',
      width: '100px',
      height: '100px',
      justifyContent: 'center',
      textAlign: 'center'
    }}
  >
    <img
      src={icon}
      width={35}
      height={35}
      style={{ borderRadius: '50%' }}
      alt="logo"
    />
    <Typography sx={{ fontWeight: 'bold' }}>{balance}</Typography>
    <Typography sx={{ fontSize: '12px' }}>{title}</Typography>
  </Stack>
)
export default Balance
