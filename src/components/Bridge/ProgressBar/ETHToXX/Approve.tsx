import { Stack, Typography } from '@mui/material'
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
import { CustomStep, RootState } from '@/plugins/redux/types'
import { useAppDispatch, useAppSelector } from '@/plugins/redux/hooks'
import { actions, emptyState } from '@/plugins/redux/reducers'
import { getApprovalFromAddress } from '@/plugins/redux/selectors'

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
  const [ready, setReady] = useState<boolean>(false)
  const [prompted, setPrompted] = useState<boolean>(false)

  // use redux
  const approvalState =
    useAppSelector(
      (state: RootState) => address && getApprovalFromAddress(state, address)
    ) || emptyState.toNative.approval
  const dispatch = useAppDispatch()

  // Confirm approve state
  // useEffect(() => {
  //   // If step is greater than 1 (Approval Step), then we are done
  //   if (currState.tx.status.step > 1) {
  //     console.log('STEP > 1: Approval complete', currState.tx.status.step)
  //     done()
  //   }
  // }, [currState.tx.status.step, done])

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      // No need to call resetKeys here, since we are only resetting the approval state
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
      switch (approvalState.status.step) {
        /* -------------------------------- Init ------------------------------- */
        case State.Init: {
          // If contract write error, reset state else prompt user to deposit
          if (errorApprovePrepare) {
            console.error(`Error approving spending:`, errorApprovePrepare)
            resetState(`Error approving spending: ${errorApprovePrepare.name}`)
          } else if (statusPrepareContractWrite === 'success' && ready) {
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
          console.log(`Prompting user to approve spending...`)
          // if deposit tx hash exists on local storage go to wait state
          if (approvalState.txHash) {
            dispatch(
              actions.setApprovalStatus({
                key: address,
                status: Steps[State.Wait]
              })
            )
            break
          }
          // call approval
          if (callApprove && !isLoadingApprove) {
            callApprove()
            dispatch(
              actions.setApprovalStatus({
                key: address,
                status: Steps[State.Sign]
              })
            )
          }
          break
        }

        /* -------------------------------- Sign ------------------------------ */
        case State.Sign: {
          console.log(`Waiting for approval to be signed...`)
          if (errorApproveWrite) {
            console.error(`Error executing approval: ${errorApproveWrite}`)
            resetState(`Error executing approval: User rejected the request`)
          }
          if (dataApprove?.hash) {
            dispatch(
              actions.setApprovalStatus({
                key: address,
                status: Steps[State.Wait]
              })
            )
            dispatch(
              actions.setApprovalTxHash({
                key: address,
                hash: dataApprove.hash
              })
            )
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
              const approvalReceipt = await waitForTransaction({
                hash: approvalState.txHash as `0x${string}`,
                confirmations: 3
              })
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
    ready,
    address,
    approvalState,
    errorApprovePrepare,
    statusPrepareContractWrite,
    isLoadingApprove,
    errorApproveWrite,
    dataApprove,
    callApprove,
    resetState,
    done
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
        <Typography variant="body1">{approvalState.status.message}</Typography>
      )}
      {approvalState.status.step === State.Sign && !errorApproveWrite && (
        <Stack
          sx={{
            flexDirection: 'column',
            marginTop: '20px !important'
          }}
          spacing="10px"
        >
          <Typography variant="body2">
            Please confirm the transaction in your wallet. If you do not see a
            confirmation prompt to sign this transaction, please check your
            wallet settings or try again by pressing the button below. Make sure
            you do not have any queued transactions in your wallet before
            proceeding.
          </Typography>
          <StyledButton
            onClick={() => {
              dispatch(
                actions.setApprovalStatus({
                  key: address,
                  status: Steps[State.Prompt]
                })
              )
              setPrompted(true)
            }}
            disabled={isLoadingApprove || prompted}
            small
          >
            {prompted ? 'Trying Approval...' : 'Retry Approval'}
          </StyledButton>
        </Stack>
      )}
    </Stack>
  )
}

export default Approve
