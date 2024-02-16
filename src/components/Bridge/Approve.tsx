import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction
} from 'wagmi'
import Loading from '../Utils/Loading'
import IERC20 from '../../contracts/IERC20.json'
import {
  BRIDGE_ERC20_HANDLER_ADDRESS,
  MAX_UINT256,
  WRAPPED_XX_ADDRESS
} from '@/consts'

interface ApproveProps {
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

const Approve: React.FC<ApproveProps> = ({ error, done }) => {
  // Hooks
  const { address } = useAccount()

  const [step, setStep] = useState<Step>(Step.Prompt)

  // Reset state + call error prop
  const resetAll = useCallback(() => {
    setStep(Step.Prompt)
    error()
  }, [error])

  // TODO: improve error handling + flow?

  // Approval call
  const { config: configApprove, error: errorApprove } =
    usePrepareContractWrite({
      address: WRAPPED_XX_ADDRESS as `0x${string}`,
      abi: IERC20.abi,
      functionName: 'approve',
      args: [BRIDGE_ERC20_HANDLER_ADDRESS, MAX_UINT256],
      account: address
    })
  const {
    data: approveData,
    write: callApprove,
    isLoading: approveLoading
  } = useContractWrite(configApprove)

  // Wait for approve transaction
  const { data: approveReceipt, error: errorWaitApprove } =
    useWaitForTransaction({
      hash: approveData?.hash || '0x',
      confirmations: 5
    })

  // State machine
  useEffect(() => {
    switch (step) {
      /* ---------------------------- Prompt ---------------------------- */
      case Step.Prompt: {
        if (errorApprove) {
          console.error('Error executing approve', errorApprove)
          resetAll()
        }
        if (callApprove) {
          console.log(`Executing approval`)
          callApprove()
          setStep(Step.Sign)
        }
        break
      }

      /* ---------------------------- Sign ---------------------------- */
      case Step.Sign: {
        if (approveLoading) {
          console.log(`Waiting for approval signature...`)
        } else {
          setStep(Step.Wait)
        }
        break
      }

      /* ---------------------------- Wait ---------------------------- */
      case Step.Wait: {
        if (errorWaitApprove) {
          console.log(`Approval failed!`)
          resetAll()
        }
        if (approveReceipt) {
          console.log(`Approval complete!`)
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
  }, [
    step,
    errorApprove,
    callApprove,
    approveLoading,
    approveReceipt,
    errorWaitApprove,
    resetAll,
    done
  ])

  // TODO: improve UI
  return (
    <Stack direction="column" padding={2} alignItems="center">
      <Typography>Approving spending of wrapped XX ...</Typography>
      <Loading size="sm2" />
    </Stack>
  )
}

export default Approve
