import { useCallback } from 'react'
import { useNetwork, useSwitchNetwork } from 'wagmi'
import { localConfig } from '@/plugins/wagmi'

// TODO: Add support for other networks and remove Goerli
export const supportedNetworkIds = [
  {
    id: localConfig.id,
    name: localConfig.name
  }
]

export const useSwitchToSupportedNetwork = () => {
  const { chain } = useNetwork()
  const { chains, error, isSuccess, isLoading, switchNetworkAsync } =
    useSwitchNetwork()

  const addNetworkChain = async (config: any) => {
    // check is network added
    if (chains?.find(c => c.id === config.id)) {
      return true
    }
    const network = {
      chainId: `0x${config.id.toString(16)}`,
      chainName: config.name,
      nativeCurrency: {
        name: config.token,
        symbol: config.token,
        decimals: 18
      },
      rpcUrls: [config.rpcUrls.public.http[0]],
      blockExplorerUrls: [config.blockExplorers.default.url]
    }
    if (!window.ethereum) {
      throw new Error('No ethereum provider found')
      return false
    }
    try {
      await (window.ethereum as any).request({
        method: 'wallet_addEthereumChain',
        params: [network]
      })
      return true
    } catch (err: any) {
      console.error('Error adding network', err.message)
      return false
    }
  }

  const trigger = useCallback(
    async (id: number) => {
      if (
        chain &&
        chains &&
        !supportedNetworkIds.map(network => network.id).includes(chain.id)
      ) {
        console.log('switching network')
        const res = await addNetworkChain(localConfig)
        if (!res) {
          console.error('Error adding network')
          return
        }
        await switchNetworkAsync?.(id)
        console.log('network switched')
      }
    },
    [chain, chains, switchNetworkAsync]
  )

  return { error, isSuccess, isLoading, trigger }
}
