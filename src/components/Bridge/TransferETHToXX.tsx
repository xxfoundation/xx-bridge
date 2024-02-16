import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import Loading from '../Utils/Loading'
import Approve from './Approve'
import Deposit from './Deposit'

interface TransferETHToXXProps {
  approve: boolean
  recipient: string
  amount: bigint
  reset: () => void
}

// Steps
enum Step {
  Init = 0,
  ApproveSpend = 1,
  BridgeDeposit = 2,
  WaitBridge = 3,
  Done = 4
}

const TransferETHToXX: React.FC<TransferETHToXXProps> = ({
  approve,
  recipient,
  amount,
  reset
}) => {
  const [step, setStep] = useState<Step>(Step.Init)

  // Reset state + call prop
  const resetAll = useCallback(() => {
    setStep(Step.Init)
    reset()
  }, [reset])

  // State machine
  useEffect(() => {
    const executeStep = async () => {
      switch (step) {
        /* -------------------------------- Init ------------------------------- */
        case Step.Init: {
          // Go to approve if needed, otherwise go to deposit
          if (approve) {
            setStep(Step.ApproveSpend)
          } else {
            setStep(Step.BridgeDeposit)
          }
          break
        }

        /* ---------------------------- ApproveSpend ---------------------------- */
        case Step.ApproveSpend: {
          // Noop
          break
        }

        /* ---------------------------- BridgeDeposit ---------------------------- */
        case Step.BridgeDeposit: {
          // Noop
          break
        }

        /* ---------------------------- WaitBridge ---------------------------- */
        case Step.WaitBridge: {
          // TODO: query xx indexer
          setTimeout(() => {
            setStep(Step.Done)
          }, 5000)
          break
        }

        /* ---------------------------- Done ---------------------------- */
        case Step.Done: {
          setTimeout(() => {
            resetAll()
          }, 3000)
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          throw new Error(`Unknown step: ${step}`)
      }
    }
    if (recipient !== '' && amount !== undefined) {
      executeStep()
    }
  }, [step, recipient, amount, approve, resetAll])

  // TODO: improve UI
  return (
    <Stack direction="column" padding={2} justifyContent="center">
      {approve && step === Step.ApproveSpend && (
        <Approve error={resetAll} done={() => setStep(Step.BridgeDeposit)} />
      )}
      {step === Step.BridgeDeposit && (
        <Deposit
          recipient={recipient}
          amount={amount}
          error={resetAll}
          done={() => setStep(Step.WaitBridge)}
        />
      )}
      {step === Step.WaitBridge && (
        <Stack direction="column" padding={2} alignItems="center">
          <Typography>Waiting for Bridge ...</Typography>
          <Loading size="sm2" />
        </Stack>
      )}
      {step === Step.Done && (
        <Typography variant="h5">Transfer complete!</Typography>
      )}
    </Stack>
  )
}

export default TransferETHToXX
