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

// TODO: link this steps with the ones in TransferETHToXX.tsx
type DepositStatus =
  | 'Init'
  | 'Pending Prompt'
  | 'Executing Deposit'
  | 'Waiting for Deposit Signature'
  | 'Deposit Complete'
  | 'Deposit Failed'
  | 'Transfer Completed'
  | 'Unknown Error'

const Deposit: React.FC<DepositProps> = ({
  recipient,
  amount,
  error,
  done
}) => {
  // Hooks
  const { address } = useAccount()

  const [step, setStep] = useState<Step>(Step.Prompt)
  const [status, setStatus] = useState<DepositStatus>('Init')

  // Reset state + call error prop
  const resetAll = useCallback(() => {
    setStep(Step.Prompt)
    error()
  }, [error])

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
          setStatus('Pending Prompt')
          if (errorDeposit) {
            setStatus('Deposit Failed')
            resetAll()
          }
          if (callDeposit) {
            setStatus('Executing Deposit')
            callDeposit()
            setStep(Step.Sign)
          }
          break
        }

        /* ---------------------------- Sign ---------------------------- */
        case Step.Sign: {
          if (depositLoading) {
            setStatus('Waiting for Deposit Signature')
          } else {
            setStep(Step.Wait)
          }
          break
        }

        /* ---------------------------- Wait ---------------------------- */
        case Step.Wait: {
          if (errorWaitDeposit) {
            setStatus('Deposit Failed')
            resetAll()
          }
          if (depositReceipt) {
            setStatus('Deposit Complete')
            setStep(Step.Done)
          }
          break
        }

        /* ---------------------------- Done ---------------------------- */
        case Step.Done: {
          setStatus('Transfer Completed')
          done()
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          setStatus('Unknown Error')
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

  return (
    <Stack direction="column" spacing="20px" padding={2} alignItems="center">
      <Typography variant="h5" fontWeight="bold">
        Deposit
      </Typography>
      <Typography>{status}</Typography>
      <Loading size="sm2" />
    </Stack>
  )
}

export default Deposit
