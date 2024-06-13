import { BN } from '@polkadot/util'
import { useState, useCallback, useEffect } from 'react'
import useApi from '@/plugins/substrate/hooks/useApi'
import { isValidXXNetworkAddress } from '@/utils'

const useXxBalance = (address: string) => {
  const [xxBalance, setXXBalance] = useState<BN>(new BN(0))
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true)
  const [counter, setCounter] = useState<number>(0)
  const { api, ready } = useApi()

  const fetchXxBalance = useCallback(() => {
    if (
      api &&
      api?.query?.system?.account &&
      address &&
      isValidXXNetworkAddress(address)
    ) {
      setIsLoadingBalance(true)
      api.query.system
        .account(address)
        .then(({ data }) => {
          if (data) {
            const balance = data.free.add(data.reserved)
            setXXBalance(balance)
          }
        })
        .catch(console.error)
        .finally(() => {
          setTimeout(() => {
            setCounter(prevCounter => prevCounter + 1)
          }, 10000)
          setIsLoadingBalance(false)
        })
    }
  }, [api, ready, address])

  useEffect(() => {
    fetchXxBalance()
  }, [fetchXxBalance, counter])

  return { xxBalance, isLoadingBalance }
}

export default useXxBalance
