import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography } from '@mui/material'
import StyledStack from '../components/Custom/StyledStack'
import StyledButton from '../components/Custom/StyledButton'
import TransferCard from '@/components/Transfer/TransferCard'
import xxLogo from '@/assets/currencies/xx.jpeg'
import ethLogo from '@/assets/currencies/eth.png'

const Bridge: React.FC = () => {
  const navigate = useNavigate()
  const from = {
    code: 'XX',
    name: 'xx network',
    symbol: xxLogo,
    balance: 4.0,
    conversionRate: 0.0001
  }
  const to = {
    code: 'ETH',
    name: 'Ethereum',
    symbol: ethLogo,
    balance: 2.0,
    conversionRate: 0.0002
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
