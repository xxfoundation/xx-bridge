import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi'
import { waitForTransaction } from 'wagmi/actions'
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
    message: 'Waiting for user to click approve'
  },
  {
    state: State.Prompt,
    message: 'Prompting user to approve spending'
  },
  {
    state: State.Sign,
    message: 'Signing approval'
  },
  {
    state: State.Wait,
    message: 'Waiting for approval block confirmations (3)'
  },
  {
    state: State.Done,
    message: 'Approval complete. Redirecting to Deposit...'
  }
]

const Approve: React.FC<ApproveProps> = ({ error, done }) => {
  // Hooks
  const { address } = useAccount()

  const [step, setStep] = useState<Step>(Steps[State.Init])

  // Reset state + call error prop
  const resetAll = useCallback(() => {
    setStep(Steps[State.Init])
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
  const { writeAsync: callApproveAsync } = useContractWrite(configApprove)

  // Approval promise
  const approvePromise = useCallback(async () => {
    setStep(Steps[State.Sign])
    if (callApproveAsync) {
      callApproveAsync()
        .then(async data => {
          console.log(`Approval data:`, data)
          if (data?.hash) {
            setStep(Steps[State.Wait])
            try {
              console.log(`Waiting for approval:`, data.hash)
              const approveReceipt = await waitForTransaction({
                hash: data.hash,
                confirmations: 3
              })
              if (approveReceipt) {
                console.log(`Approval receipt:`, approveReceipt)
                setStep(Steps[State.Done])
                setTimeout(() => {
                  console.log(`Approval done`)
                  done()
                }, 2000)
              }
            } catch (err) {
              console.error(`Error waiting for approval:`, err)
              resetAll()
            }
          }
        })
        .catch(err => {
          console.error(`Error executing approval:`, err)
          resetAll()
        })
    }
  }, [callApproveAsync])

  // State machine
  useEffect(() => {
    if (errorApprove) {
      console.error(`Error approving spending:`, errorApprove)
      resetAll()
    }
    if (step.state === State.Prompt) {
      approvePromise()
    }
  }, [errorApprove, step])

  return (
    <Stack direction="column" spacing="20px" padding={2} alignItems="center">
      <Typography variant="h5" fontWeight="bold">
        Approve Spending
      </Typography>
      {step.state === State.Init ? (
        <>
          {' '}
          <Typography variant="body1" sx={{ width: '70%' }}>
            This will allow the Bridge to spend wrapped XX on your behalf. This
            is a one-time operation. The bridge smart contract has no way of
            spending your funds without you initialing the transfer.
          </Typography>
          <StyledButton
            onClick={() => {
              setStep(Steps[State.Prompt])
            }}
          >
            Approve
          </StyledButton>
        </>
      ) : (
        <>
          <Typography variant="body1">{step.message}</Typography>
          <Loading size="sm2" />
        </>
      )}
    </Stack>
  )
}

export default Approve
