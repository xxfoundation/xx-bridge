import React from 'react'
import StyledStack from '../components/Custom/StyledStack'
import TransferCard from '@/components/Transfer/TransferCard'
import xxLogo from '@/assets/currencies/xx.jpeg'
import ethLogo from '@/assets/currencies/eth.png'
import ApiProvider from '../plugins/substrate/components/ApiProvider.tsx'

const from = {
  code: 'wXX',
  name: 'Ethereum Mainnet',
  symbol: ethLogo
}
const to = {
  code: 'XX',
  name: 'xx network',
  symbol: xxLogo
}

const Bridge: React.FC = () => (
  <ApiProvider>
    <StyledStack direction="column" spacing="40px" centerWidth centerHeight>
      <TransferCard from={from} to={to} />
    </StyledStack>
  </ApiProvider>
)

export default Bridge
