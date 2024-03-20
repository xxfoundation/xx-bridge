/* eslint-disable import/no-extraneous-dependencies */
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { configureChains, mainnet } from '@wagmi/core'
import { publicProvider } from '@wagmi/core/providers/public'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { createConfig } from 'wagmi'
import { defineChain } from 'viem'

const projectId = process.env.WALLET_CONNECT_PROJECT_ID || ''
const httpUrl = process.env.ETH_API_URL || 'http://localhost:8545'

// const metadata = {
//   name: 'Web3Modal',
//   description: 'Web3Modal Example',
//   url: 'https://web3modal.com',
//   icons: ['https://avatars.githubusercontent.com/u/37784886']
// }

export const localConfig = {
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
      url: ''
    }
  },
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  }
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, defineChain(localConfig)],
  [publicProvider()]
)

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'wagmi'
      }
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        showQrModal: false
      }
    }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true
      }
    })
  ],
  publicClient,
  webSocketPublicClient
})

export function init() {
  if (!projectId) {
    throw new Error('WalletConnect project ID is required')
  }
  createWeb3Modal({
    wagmiConfig,
    projectId,
    chains,
    featuredWalletIds: []
  })
}
