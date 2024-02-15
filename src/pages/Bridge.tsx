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
    balance: 10.0
  }
  const to = {
    code: 'ETH',
    name: 'Ethereum Mainnet',
    symbol: ethLogo,
    balance: 2.0
  }

  return (
    <StyledStack direction="column" spacing="40px" centerWidth centerHeight>
      <TransferCard from={from} to={to} />
    </StyledStack>
  )
}

export default Bridge
