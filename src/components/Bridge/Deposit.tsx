import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi'
import { waitForTransaction } from 'wagmi/actions'
import contracts from '@/contracts'
import {
  BRIDGE_ADDRESS,
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RESOURCE_ID_XX
} from '@/consts'
import { encodeBridgeDeposit } from '@/utils'

interface DepositProps {
  recipient: string
  amount: bigint
  setError: (message: string) => void
  setDepositTxHash: (hash: string) => void
  done: () => void
}

enum State {
  Init = 0,
  Prompt = 1,
  Sign = 2,
  Wait = 3,
  Done = 4
}

type Step = {
  state: State
  message: string
}

const Steps: Step[] = [
  {
    state: State.Init,
    message: 'Initializing deposit'
  },
  {
    state: State.Prompt,
    message: 'Prompting user to deposit'
  },
  {
    state: State.Sign,
    message: 'Signing deposit'
  },
  {
    state: State.Wait,
    message: 'Waiting for deposit block confirmations (3)'
  },
  {
    state: State.Done,
    message: 'Deposit complete'
  }
]

const Deposit: React.FC<DepositProps> = ({
  recipient,
  amount,
  setError,
  setDepositTxHash,
  done
}) => {
  // Hooks
  const { address } = useAccount()

  const [step, setStep] = useState<Step>(Steps[State.Init])

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      setStep(Steps[State.Init])
      setError(msg)
    },
    [setError]
  )

  // Bridge deposit call
  const deposit = useMemo(
    () => encodeBridgeDeposit(recipient, amount),
    [recipient, amount]
  )
  const {
    config: configDeposit,
    error: errorDeposit,
    status: statusPrepareContractWrite
  } = usePrepareContractWrite({
    address: BRIDGE_ADDRESS,
    abi: contracts.bridgeAbi,
    functionName: 'deposit',
    args: [BRIDGE_ID_XXNETWORK, BRIDGE_RESOURCE_ID_XX, deposit],
    account: address
  })
  const { writeAsync: callDepositAsync } = useContractWrite(configDeposit)

  // Deposit promise
  const depositPromise = useCallback(async () => {
    setStep(Steps[State.Sign])
    console.log(`Signing deposit...`)
    if (callDepositAsync) {
      callDepositAsync()
        .then(async data => {
          console.log(`Deposit data:`, data)
          if (data?.hash) {
            setDepositTxHash(data.hash)
            setStep(Steps[State.Wait])
            try {
              console.log(`Waiting for deposit:`, data.hash)
              const depositReceipt = await waitForTransaction({
                hash: data.hash,
                confirmations: 3
              })
              if (depositReceipt) {
                console.log(`Deposit receipt:`, depositReceipt)
                setStep(Steps[State.Done])
                setTimeout(() => {
                  console.log(`Deposit done`)
                  done()
                }, 2000)
              }
            } catch (err) {
              console.error(`Error waiting for deposit:`, err)
              resetState('Deposit transaction failed')
            }
          }
        })
        .catch(err => {
          console.error(`Error executing deposit:`, err)
          resetState('User rejected transaction signature')
        })
    }
  }, [callDepositAsync])

  useEffect(() => {
    if (errorDeposit) {
      console.error(`Error deposit:`, errorDeposit)
      resetState(`Error depositing: ${errorDeposit.message}`)
    } else if (statusPrepareContractWrite === 'success') {
      setStep(Steps[State.Prompt])
    }
  }, [errorDeposit, statusPrepareContractWrite, resetState, setStep])

  useEffect(() => {
    if (step.state === State.Prompt) {
      console.log(`Prompting user to deposit...`)
      depositPromise()
    }
  }, [depositPromise, step])

  return (
    <Stack direction="column" spacing="20px" padding={2} alignItems="center">
      <Typography variant="h5" fontWeight="bold">
        Deposit
      </Typography>
      <Typography variant="body1">{step.message}</Typography>
    </Stack>
  )
}

export default Deposit
