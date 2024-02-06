import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography } from '@mui/material'
import StyledStack from '../components/Custom/StyledStack'
import StyledButton from '../components/Custom/StyledButton'
import TransferCard from '@/components/Transfer/TransferCard'

const Bridge: React.FC = () => {
  const navigate = useNavigate()
  const from = {
    code: 'XX',
    name: 'xx network',
    symbol: 'https://via.placeholder.com/25',
    balance: 4.0
  }
  const to = {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'https://via.placeholder.com/25',
    balance: 2.0
  }

  return (
    <StyledStack direction="column" spacing="40px" centerWidth centerHeight>
      <Typography variant="h1">Bridge</Typography>
      <TransferCard from={from} to={to} />
      <Typography variant="h3">Under construction...</Typography>
      <StyledButton onClick={() => navigate('/')}>Home</StyledButton>
    </StyledStack>
  )
}

export default Bridge
