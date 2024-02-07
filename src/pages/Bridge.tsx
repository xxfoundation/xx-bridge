import React from 'react'
import StyledStack from '../components/Custom/StyledStack'
import TransferCard from '@/components/Transfer/TransferCard'
import xxLogo from '@/assets/currencies/xx.jpeg'
import ethLogo from '@/assets/currencies/eth.png'

const Bridge: React.FC = () => {
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
      <TransferCard from={from} to={to} />
    </StyledStack>
  )
}

export default Bridge
