import xxLogo from '@/assets/currencies/xx.jpeg'
import ethLogo from '@/assets/currencies/eth.png'

export const WRAPPED_XX_ADDRESS =
  process.env.WRAPPED_XX_ADDRESS || '0x3f709398808af36ADBA86ACC617FeB7F5B7B193E'

export const BRIDGE_ERC20_HANDLER_ADDRESS =
  process.env.BRIDGE_ERC20_HANDLER_ADDRESS ||
  '0x3167776db165D8eA0f51790CA2bbf44Db5105ADF'

export const BRIDGE_ADDRESS =
  process.env.BRIDGE_ADDRESS || '0x62877dDCd49aD22f5eDfc6ac108e9a4b5D2bD88B'

// Bridge constants
export const BRIDGE_ID_XXNETWORK = 0
export const BRIDGE_ID_ETH_MAINNET = 1
export const BRIDGE_RESOURCE_ID_XX =
  '0x26c3ecba0b7cea7c131a6aedf4774f96216318a2ae74926cd0e01832a0b0b500'

// Gas estimates

// This is a rough estimate of the gas required to approve ERC20 Handler to
// spend MAX_UINT256 tokens. This is a one-time operation.
export const GAS_ESTIMATE_APPROVE = 50000

// This is a rough estimate of the gas required to deposit tokens into the bridge.
// On the first deposit this estimate is pretty accurate.
// On following deposits, the actual gas is usually lower.
export const GAS_ESTIMATE_DEPOSIT = 80000

export const MAX_UINT256 =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

// Network definitions
export const ethereumMainnet = {
  name: 'Ethereum Mainnet',
  gasToken: {
    code: 'ETH',
    symbol: ethLogo,
    decimals: 18
  },
  token: {
    address: WRAPPED_XX_ADDRESS,
    code: 'wXX',
    symbol: xxLogo,
    decimals: 9
  }
}

export const xxNetwork = {
  name: 'xx network',
  gasToken: {
    code: 'XX',
    symbol: xxLogo,
    decimals: 9
  }
}
