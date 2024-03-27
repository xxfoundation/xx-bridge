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
  BRIDGE_ERC20_HANDLER_ADDRESS,
  BRIDGE_SPENDING_LIMIT,
  WRAPPED_XX_ADDRESS
} from '@/consts'
import StyledButton from '../custom/StyledButton'

interface ApproveProps {
  error: () => void
  done: () => void
}

// Steps
enum Step {
  Init = 0,
  Prompt = 1,
  Sign = 2,
  Wait = 3,
  Done = 4
}

const Approve: React.FC<ApproveProps> = ({ error, done }) => {
  // Hooks
  const { address } = useAccount()

  const [step, setStep] = useState<Step>(Step.Init)

  // Reset state + call error prop
  const resetAll = useCallback(() => {
    setStep(Step.Init)
    error()
  }, [error])

  // Approval call
  const { config: configApprove, error: errorApprove } =
    usePrepareContractWrite({
      address: WRAPPED_XX_ADDRESS,
      abi: contracts.ierc20Abi,
      functionName: 'approve',
      args: [BRIDGE_ERC20_HANDLER_ADDRESS, BRIDGE_SPENDING_LIMIT],
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
      case Step.Init: {
        // Informational step
        // Wait for user to click in approve button
        break
      }

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
        // TODO: confirm with XX indexer
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

  return (
    <Stack direction="column" spacing="20px" padding={2} alignItems="center">
      <Typography variant="h5" fontWeight="bold">
        Approve Spending
      </Typography>
      {step === Step.Init ? (
        <>
          {' '}
          <Typography variant="body1" sx={{ width: '70%' }}>
            This will allow the Bridge to spend wrapped XX on your behalf. This
            is a one-time operation. The bridge smart contract has no way of
            spending your funds without you initialing the transfer.
          </Typography>
          <StyledButton
            onClick={() => {
              setStep(Step.Prompt)
            }}
          >
            Approve
          </StyledButton>
        </>
      ) : (
        <>
          <Typography variant="body1">
            Approving spending of wrapped XX ...
          </Typography>
          <Loading size="sm2" />
        </>
      )}
    </Stack>
  )
}

export default Approve
