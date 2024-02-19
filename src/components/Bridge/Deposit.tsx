import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction
} from 'wagmi'
import Loading from '../Utils/Loading'
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
  error: () => void
  done: () => void
}

// Steps
enum Step {
  Prompt = 0,
  Sign = 1,
  Wait = 2,
  Done = 3
}

const Deposit: React.FC<DepositProps> = ({
  recipient,
  amount,
  error,
  done
}) => {
  // Hooks
  const { address } = useAccount()

  const [step, setStep] = useState<Step>(Step.Prompt)

  // Reset state + call error prop
  const resetAll = useCallback(() => {
    setStep(Step.Prompt)
    error()
  }, [error])

  // TODO: improve error handling + flow?

  // Bridge deposit call
  const deposit = encodeBridgeDeposit(recipient, amount)
  const { config: configDeposit, error: errorDeposit } =
    usePrepareContractWrite({
      address: BRIDGE_ADDRESS,
      abi: contracts.bridgeAbi,
      functionName: 'deposit',
      args: [BRIDGE_ID_XXNETWORK, BRIDGE_RESOURCE_ID_XX, deposit],
      account: address
    })
  const {
    data: depositData,
    write: callDeposit,
    isLoading: depositLoading
  } = useContractWrite(configDeposit)

  // Wait for deposit transaction
  const { data: depositReceipt, error: errorWaitDeposit } =
    useWaitForTransaction({
      hash: depositData?.hash || '0x',
      confirmations: 5
    })

  // State machine
  useEffect(() => {
    const executeStep = async () => {
      switch (step) {
        /* ---------------------------- Prompt ---------------------------- */
        case Step.Prompt: {
          if (errorDeposit) {
            console.error('Error executing deposit', errorDeposit)
            resetAll()
          }
          if (callDeposit) {
            console.log(`Executing deposit`)
            callDeposit()
            setStep(Step.Sign)
          }
          break
        }

        /* ---------------------------- Sign ---------------------------- */
        case Step.Sign: {
          if (depositLoading) {
            console.log(`Waiting for deposit signature...`)
          } else {
            setStep(Step.Wait)
          }
          break
        }

        /* ---------------------------- Wait ---------------------------- */
        case Step.Wait: {
          if (errorWaitDeposit) {
            console.log(`Deposit failed!`)
            resetAll()
          }
          if (depositReceipt) {
            console.log(`Deposit complete!`)
            setStep(Step.Done)
          }
          break
        }

        /* ---------------------------- Done ---------------------------- */
        case Step.Done: {
          done()
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          throw new Error(`Unknown step: ${step}`)
      }
    }
    if (recipient !== '') {
      executeStep()
    }
  }, [
    step,
    errorDeposit,
    callDeposit,
    depositLoading,
    depositReceipt,
    errorWaitDeposit,
    resetAll,
    done
  ])

  // TODO: improve UI
  return (
    <Stack direction="column" padding={2} alignItems="center">
      <Typography>Transferring wrapped XX to Bridge ...</Typography>
      <Loading size="sm2" />
    </Stack>
  )
}

export default Deposit
