import { useCallback, useMemo } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { devChain } from '@/plugins/wagmi'

// TODO: Add support for other networks and remove Goerli
export const supportedNetworkIds = [
  {
    id: devChain.id,
    name: devChain.name
  }
]
export type ChainId = 9296

export const useSwitchToSupportedNetwork = () => {
  const { chain } = useAccount()
  const { chains, error, isSuccess, status, switchChainAsync } =
    useSwitchChain()

  // Loading flag
  const isLoading = useMemo(() => status === 'pending', [status])

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
        !supportedNetworkIds
          .map(network => network.id)
          .includes(chain.id as ChainId)
      ) {
        const res = await addNetworkChain(devChain)
        if (!res) {
          console.error('Error adding network')
          return
        }
        await switchChainAsync?.({ chainId: id })
      }
    },
    [chain, chains, switchChainAsync]
  )

  return { error, isSuccess, isLoading, trigger }
}
