import { createWeb3Modal } from '@web3modal/wagmi/react'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { createConfig } from 'wagmi'
import { http, defineChain } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { DAPP_NETWORK, ETH_API_URL } from '@/consts'

const projectId = process.env.WALLET_CONNECT_PROJECT_ID || ''
const httpUrl = ETH_API_URL

export const devChain = defineChain({
  name: 'Bridge Dev',
  network: 'homestead',
  id: 9296,
  rpcUrls: {
    public: {
      http: [httpUrl]
    },
    default: {
      http: [httpUrl]
    }
  },
  blockExplorers: {
    default: {
      name: 'Bridge Dev',
      url: httpUrl
    }
  },
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  }
})

export const wagmiConfig = createConfig({
  chains:
    DAPP_NETWORK === 'mainnet'
      ? [mainnet]
      : DAPP_NETWORK === 'sepolia'
        ? [sepolia]
        : [devChain],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [devChain.id]: http(httpUrl)
  },
  connectors: [
    // Wallet connect
    walletConnect({
      projectId,
      showQrModal: false
    }),
    // Coinbase wallet
    coinbaseWallet({
      appName: 'xx-bridge'
    }),
    // Any injected wallet
    injected({
      shimDisconnect: true
    })
  ]
})

export function init() {
  if (!projectId) {
    throw new Error('WalletConnect project ID is required')
  }
  createWeb3Modal({
    wagmiConfig,
    projectId,
    featuredWalletIds: []
  })
}
