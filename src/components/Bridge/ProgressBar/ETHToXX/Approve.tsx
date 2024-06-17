import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import contracts from '@/contracts'
import {
  BRIDGE_ERC20_HANDLER_ADDRESS,
  BRIDGE_SPENDING_LIMIT,
  CONFIRMATIONS_THRESHOLD,
  WRAPPED_XX_ADDRESS
} from '@/consts'
import StyledButton from '../../../custom/StyledButton'
import { CustomStep, RootState } from '@/plugins/redux/types'
import { useAppDispatch, useAppSelector } from '@/plugins/redux/hooks'
import { actions, emptyState } from '@/plugins/redux/reducers'
import { getApprovalFromAddress } from '@/plugins/redux/selectors'
import customWriteContract from '@/utils/promises'
import { wagmiConfig } from '@/plugins/wagmi'

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
  const ready = useRef<boolean>(false)
  const prompted = useRef<boolean | undefined>()
  const [approveError, setApproveError] = useState<string>('')

  // use redux
  const approvalState =
    useAppSelector(
      (state: RootState) => address && getApprovalFromAddress(state, address)
    ) || emptyState.toNative.approval
  const dispatch = useAppDispatch()

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      // No need to call resetKeys here, since we are only resetting the approval state
      setError(msg)
    },
    [setError]
  )

  // State machine
  useEffect(() => {
    const executeStep = async () => {
      switch (approvalState.status.step) {
        /* -------------------------------- Init ------------------------------- */
        case State.Init: {
          // if deposit tx hash exists on local storage go to wait state
          if (approvalState.txHash) {
            dispatch(
              actions.setApprovalStatus({
                key: address,
                status: Steps[State.Wait]
              })
            )
          } else if (ready.current) {
            dispatch(
              actions.setApprovalStatus({
                key: address,
                status: Steps[State.Prompt]
              })
            )
          }
          break
        }

        /* -------------------------------- Prompt ----------------------------- */
        case State.Prompt: {
          // if approve tx hash exists on local storage go to wait state
          if (approvalState.txHash) {
            dispatch(
              actions.setApprovalStatus({
                key: address,
                status: Steps[State.Wait]
              })
            )
            break
          }
          // if not prompted, prompt user
          console.log(`Prompting user to approve spending...`)
          if (!prompted.current && !approveError && address) {
            prompted.current = true
            try {
              const hash = await customWriteContract({
                address: WRAPPED_XX_ADDRESS,
                abi: contracts.ierc20Abi,
                functionName: 'approve',
                args: [BRIDGE_ERC20_HANDLER_ADDRESS, BRIDGE_SPENDING_LIMIT]
              })
              dispatch(
                actions.setApprovalTxHash({
                  key: address,
                  hash
                })
              )
              dispatch(
                actions.setApprovalStatus({
                  key: address,
                  status: Steps[State.Wait]
                })
              )
            } catch (err: any) {
              console.error(`Error executing approval: ${err}`)
              setApproveError(
                `Error waiting for approval: User rejected transaction`
              )
            }
            prompted.current = false
          }
          break
        }

        /* -------------------------------- Wait ------------------------------- */
        case State.Wait: {
          console.log(
            `Waiting for approval block confirmations (3)...`,
            approvalState
          )
          if (approvalState.txHash) {
            try {
              console.log(`Waiting for approval:`, approvalState.txHash)
              const approvalReceipt = await waitForTransactionReceipt(
                wagmiConfig,
                {
                  hash: approvalState.txHash as `0x${string}`,
                  confirmations: CONFIRMATIONS_THRESHOLD
                }
              )
              if (approvalReceipt) {
                console.log(`Approval receipt:`, approvalReceipt)
                dispatch(
                  actions.setApprovalStatus({
                    key: address,
                    status: Steps[State.Done]
                  })
                )
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
          throw new Error(`Unknown step: ${approvalState.status.step}`)
      }
    }

    if (address && approvalState) {
      executeStep()
    }
  }, [
    address,
    approvalState,
    dispatch,
    done,
    prompted.current,
    ready.current,
    resetState
  ])

  return (
    <Stack direction="column" spacing="20px" padding={2} alignItems="left">
      <Typography variant="body1" fontWeight="bold">
        {currStep}. Approve Spending
      </Typography>
      {approvalState.status.step === State.Init ? (
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
                dispatch(
                  actions.setApprovalStatus({
                    key: address,
                    status: Steps[State.Prompt]
                  })
                )
                ready.current = true
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
        <Typography variant="body1">{approvalState.status.message}</Typography>
      )}
      {approvalState.status.step === State.Prompt && (
        <Stack
          sx={{
            flexDirection: 'column',
            marginTop: '20px !important'
          }}
          alignItems="center"
          spacing="10px"
        >
          <Stack sx={{ maxWidth: '80%' }}>
            <Typography variant="body2">
              Please confirm the transaction in your wallet. If you do not see a
              confirmation prompt to sign this transaction, please check your
              wallet settings or try again by pressing the button below. Make
              sure you do not have any queued transactions in your wallet before
              proceeding.
            </Typography>
          </Stack>
          {approveError && (
            <Typography variant="body2" sx={{ color: 'red' }}>
              {approveError}
            </Typography>
          )}
          <StyledButton
            onClick={() => {
              // reset approve error
              setApproveError('')
              // set prompted to undefined
              prompted.current = undefined
              // set approve status to prompt
              dispatch(
                actions.setApprovalStatus({
                  key: address,
                  status: Steps[State.Prompt]
                })
              )
            }}
            disabled={prompted.current !== false}
            small
          >
            {prompted.current !== false
              ? 'Trying Approval...'
              : 'Retry Approval'}
          </StyledButton>
        </Stack>
      )}
    </Stack>
  )
}

export default Approve
