import { Stack, Tooltip, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi'
import { waitForTransaction } from 'wagmi/actions'
import contracts from '@/contracts'
import {
  BRIDGE_ERC20_HANDLER_ADDRESS,
  BRIDGE_SPENDING_LIMIT,
  WRAPPED_XX_ADDRESS
} from '@/consts'
import StyledButton from '../../../custom/StyledButton'
import { CustomStep } from '../Stepper'
import useLocalStorage from '@/hooks/useLocalStorage'
import { Transaction, updateTransaction } from '../Status'

interface ApproveProps {
  currStep: number
  setError: (message: string) => void
  done: () => void
}

enum State {
  Init = 0,
  Prompt = 1,
  Sign = 2,
  Wait = 3,
  Done = 4
}

const Steps: CustomStep[] = [
  {
    step: State.Init,
    message: 'Waiting for user to confirm approve...'
  },
  {
    step: State.Prompt,
    message: 'Prompted user to approve spending'
  },
  {
    step: State.Sign,
    message: 'Waiting for approval to be signed...'
  },
  {
    step: State.Wait,
    message: 'Waiting for approval block confirmations (3)...'
  },
  {
    step: State.Done,
    message: 'Approval complete'
  }
]

const Approve: React.FC<ApproveProps> = ({ currStep, setError, done }) => {
  const { address } = useAccount()
  const [step, setStep] = useState<CustomStep>(Steps[State.Init])
  const [ready, setReady] = useState<boolean>(false)

  // Local Storage
  const [transaction, setTransaction] = useLocalStorage<Transaction>(
    `tx-${address}`
  )

  // Synchronously updates 'transaction' from localStorage to immediately reflect external changes. This approach compensates for the useLocalStorage hook's delay in syncing with localStorage, ensuring 'transaction' is always current without waiting for the next re-render.
  useEffect(() => {
    const value = localStorage.getItem(`tx-${address}`)
    if (value) {
      const tx = JSON.parse(value) as Transaction
      setTransaction(tx)
    }
  }, [address])

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      setStep(Steps[State.Init])
      setError(msg)
    },
    [setError]
  )

  // Approval call
  const {
    config: configApprove,
    error: errorApprovePrepare,
    status: statusPrepareContractWrite
  } = usePrepareContractWrite({
    address: WRAPPED_XX_ADDRESS,
    abi: contracts.ierc20Abi,
    functionName: 'approve',
    args: [BRIDGE_ERC20_HANDLER_ADDRESS, BRIDGE_SPENDING_LIMIT],
    account: address
  })
  const {
    data: dataApprove,
    write: callApprove,
    isLoading: isLoadingApprove,
    error: errorApproveWrite
  } = useContractWrite(configApprove)

  // State machine
  useEffect(() => {
    const executeStep = async () => {
      switch (step.step) {
        /* -------------------------------- Init ------------------------------- */
        case State.Init: {
          if (transaction) {
            setStep(Steps[transaction.fromEth?.approvalState ?? State.Init])
          }

          // If contract write error, reset state else prompt user to deposit
          if (errorApprovePrepare) {
            console.error(`Error approving spending:`, errorApprovePrepare)
            resetState(`Error approving spending: ${errorApprovePrepare.name}`)
          } else if (statusPrepareContractWrite === 'success' && ready) {
            setStep(Steps[State.Prompt])
          }
          break
        }

        /* -------------------------------- Prompt ----------------------------- */
        case State.Prompt: {
          console.log(`Prompting user to approve spending...`)
          // if deposit tx hash exists on local storage go to wait state
          if (transaction?.fromEth?.approvalTxHash) {
            setStep(Steps[State.Wait])
            break
          }
          // call approval
          if (callApprove && !isLoadingApprove) {
            callApprove()
            setStep(Steps[State.Sign])
            updateTransaction(
              setTransaction,
              ['fromEth', 'approvalState'],
              State.Sign
            )
          }
          break
        }

        /* -------------------------------- Sign ------------------------------ */
        case State.Sign: {
          console.log(`Waiting for approval to be signed...`)
          if (errorApproveWrite) {
            console.error(`Error executing approval: ${errorApproveWrite}`)
            resetState(`Error executing approval: ${errorApproveWrite.name}`)
          }
          if (dataApprove?.hash) {
            updateTransaction(
              setTransaction,
              ['fromEth', 'approvalState'],
              State.Wait
            )
            updateTransaction(
              setTransaction,
              ['fromEth', 'approvalTxHash'],
              dataApprove.hash as `0x${string}`
            )
            setStep(Steps[State.Wait])
          }
          break
        }

        /* -------------------------------- Wait ------------------------------- */
        case State.Wait: {
          console.log(
            `Waiting for approval block confirmations (3)...`,
            transaction
          )
          if (transaction?.fromEth?.approvalTxHash) {
            try {
              console.log(
                `Waiting for approval:`,
                transaction.fromEth.approvalTxHash
              )
              const approvalReceipt = await waitForTransaction({
                hash: transaction.fromEth.approvalTxHash as `0x${string}`,
                confirmations: 3
              })
              if (approvalReceipt) {
                console.log(`Approval receipt:`, approvalReceipt)
                setStep(Steps[State.Done])
              }
            } catch (err: any) {
              console.error(`Error waiting for approval: ${err}`)
              resetState(`Error waiting for approval: ${err.message}`)
            }
          }
          break
        }

        /* -------------------------------- Done ------------------------------- */
        case State.Done: {
          console.log(`Approval complete`)
          done()
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          throw new Error(`Unknown step: ${step}`)
      }
    }
    if (address) {
      executeStep()
    }
  }, [
    ready,
    step,
    address,
    transaction,
    errorApprovePrepare,
    statusPrepareContractWrite,
    isLoadingApprove,
    errorApproveWrite,
    dataApprove,
    callApprove,
    setTransaction,
    resetState,
    done
  ])

  return (
    <Stack direction="column" spacing="20px" padding={2} alignItems="left">
      <Typography variant="body1" fontWeight="bold">
        {currStep}. Approve Spending
      </Typography>
      {step.step === State.Init ? (
        <>
          {' '}
          <Typography variant="body1" sx={{ width: '70%' }}>
            This will allow the Bridge to spend wrapped XX on your behalf. A
            large amount (1B) is used in order to make this is a one-time
            operation. This is safe, since the Bridge smart contract ensures
            that your funds can only be spent when you execute the bridge
            transfer, not anyone else.
          </Typography>
          <Stack direction="row" spacing="20px">
            <StyledButton
              onClick={() => {
                setReady(true)
              }}
            >
              Approve
            </StyledButton>
            <StyledButton
              onClick={() => {
                resetState('')
              }}
            >
              Go Back
            </StyledButton>
          </Stack>
        </>
      ) : (
        <Typography variant="body1">{step.message}</Typography>
      )}
      {step.step === State.Sign && (
        <Tooltip title="Only click this button if you do not have any approval popups. If you do, please close them and only then ask for new signature prompt.">
          <StyledButton
            onClick={() => {
              setStep(Steps[State.Prompt])
            }}
          >
            Re-Prompt User to Approve
          </StyledButton>
        </Tooltip>
      )}
    </Stack>
  )
}

export default Approve
