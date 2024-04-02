import { BN } from '@polkadot/util'
import { useState, useCallback, useEffect } from 'react'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import useApi from '@/plugins/substrate/hooks/useApi'

const useXxBalance = () => {
  const { selectedAccount } = useAccounts()
  const [xxBalance, setXXBalance] = useState<BN>(new BN(0))
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true)
  const [counter, setCounter] = useState<number>(0)
  const [timer, setTimer] = useState<NodeJS.Timeout>()
  const { api, ready } = useApi()

  const fetchXxBalance = useCallback(() => {
    if (api && api?.query?.system?.account && selectedAccount?.address) {
      setIsLoadingBalance(true)
      api.query.system
        .account(selectedAccount.address)
        .then(({ data }) => {
          if (data) {
            const balance = data.free.add(data.reserved)
            setXXBalance(balance)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingBalance(false))
    }
  }, [api, ready, selectedAccount])

  useEffect(() => {
    fetchXxBalance()
  }, [fetchXxBalance, timer, counter])

  useEffect(() => {
    if (ready) {
      const auxTimer = setInterval(() => {
        setCounter(prevCounter => prevCounter + 1)
      }, 10000)
      setTimer(auxTimer)
    }
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [ready, setCounter, setTimer])

  return { xxBalance, isLoadingBalance }
}

export default useXxBalance
