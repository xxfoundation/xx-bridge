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
import StyledButton from '@/components/custom/StyledButton'
import { CustomStep, RootState } from '@/plugins/redux/types'
import { useAppSelector, useAppDispatch } from '@/plugins/redux/hooks'
import { actions, emptyState } from '@/plugins/redux/reducers'
import {
  getDepositFromAddress,
  getTxFromAddress
} from '@/plugins/redux/selectors'

interface DepositProps {
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
    message: 'Initializing deposit...'
  },
  {
    step: State.Prompt,
    message: 'Prompted user to sign deposit...'
  },
  {
    step: State.Sign,
    message: 'Waiting for deposit to be signed...'
  },
  {
    step: State.Wait,
    message: 'Waiting for deposit block confirmations (3)...'
  },
  {
    step: State.Done,
    message: 'Deposit complete'
  }
]

const Deposit: React.FC<DepositProps> = ({ currStep, setError, done }) => {
  // Hooks
  const { address } = useAccount()
  const [prompted, setPrompted] = useState<boolean>(false)
  // use redux
  const tx = useAppSelector(
    (state: RootState) => address && getTxFromAddress(state, address)
  )
  const depositState =
    useAppSelector(
      (state: RootState) => address && getDepositFromAddress(state, address)
    ) || emptyState.toNative.deposit
  const dispatch = useAppDispatch()

  // Confirm deposit state
  // useEffect(() => {
  //   // If step is greater than 3 (Deposit Step), then we are done
  //   if (currState.tx.status.step > 3) {
  //     console.log('STEP > 3: Deposit complete', currState.tx.status.step)
  //     done()
  //   }
  // }, [currState.tx.status.step, done])

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      // No need to call resetKeys here, since we are only resetting the deposit state
      setError(msg)
    },
    [setError]
  )

  // Bridge deposit call
  const deposit: `0x${string}` = useMemo(
    () =>
      (tx && encodeBridgeDeposit(tx.destinationddress, BigInt(tx.amount))) ||
      '0x',
    [tx]
  )
  const {
    config: configDeposit,
    error: errorDepositPrepare,
    status: statusPrepareContractWrite
  } = usePrepareContractWrite({
    address: BRIDGE_ADDRESS,
    abi: contracts.bridgeAbi,
    functionName: 'deposit',
    args: [BRIDGE_ID_XXNETWORK, BRIDGE_RESOURCE_ID_XX, deposit],
    account: address
  })
  const {
    data: dataDeposit,
    write: callDeposit,
    isLoading: isLoadingDeposit,
    error: errorDepositWrite
  } = useContractWrite(configDeposit)

  // State machine
  useEffect(() => {
    const executeStep = async () => {
      switch (depositState.status.step) {
        /* -------------------------------- Init ------------------------------- */
        case State.Init: {
          // If contract write error, reset state else prompt user to deposit
          if (errorDepositPrepare) {
            console.error(`Error deposit:`, errorDepositPrepare)
            resetState(`Error depositing: ${errorDepositPrepare.name}`)
          } else if (statusPrepareContractWrite === 'success') {
            dispatch(
              actions.setDepositStatus({
                key: address,
                status: Steps[State.Prompt]
              })
            )
          }
          break
        }

        /* -------------------------------- Prompt ----------------------------- */
        case State.Prompt: {
          console.log(`Prompting user to deposit...`, depositState)
          // if deposit tx hash exists on local storage go to wait state
          if (depositState.txHash) {
            dispatch(
              actions.setDepositStatus({
                key: address,
                status: Steps[State.Wait]
              })
            )
            break
          }
          // call deposit
          if (callDeposit && !isLoadingDeposit) {
            callDeposit()
            dispatch(
              actions.setDepositStatus({
                key: address,
                status: Steps[State.Sign]
              })
            )
          }
          break
        }

        /* -------------------------------- Sign ------------------------------ */
        case State.Sign: {
          console.log(`Waiting for deposit to be signed...`)
          if (errorDepositWrite) {
            console.error(`Error executing depositing: ${errorDepositWrite}}`)
            resetState(`Error executing depositing: User rejected the request`)
          }
          if (dataDeposit?.hash) {
            dispatch(
              actions.setDepositStatus({
                key: address,
                status: Steps[State.Wait]
              })
            )
            dispatch(
              actions.setDepositTxHash({
                key: address,
                hash: dataDeposit.hash
              })
            )
          }
          break
        }

        /* -------------------------------- Wait ------------------------------- */
        case State.Wait: {
          console.log(
            `Waiting for deposit block confirmations (3)...`,
            depositState
          )
          if (depositState.txHash) {
            try {
              console.log(`Waiting for deposit:`, depositState.txHash)
              const depositReceipt = await waitForTransaction({
                hash: depositState.txHash as `0x${string}`,
                confirmations: 3
              })
              if (depositReceipt) {
                console.log(`Deposit receipt:`, depositReceipt)
                dispatch(
                  actions.setDepositStatus({
                    key: address,
                    status: Steps[State.Done]
                  })
                )
              }
            } catch (err: any) {
              console.error(`Error waiting for deposit: ${err}`)
              resetState(`Error waiting for deposit: ${err.message}`)
            }
          }
          break
        }

        /* -------------------------------- Done ------------------------------- */
        case State.Done: {
          console.log(`Deposit complete`)
          done()
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          throw new Error(`Unknown step: ${depositState.status.step}`)
      }
    }
    if (address && depositState) {
      executeStep()
    }
  }, [
    address,
    depositState,
    errorDepositPrepare,
    isLoadingDeposit,
    statusPrepareContractWrite,
    isLoadingDeposit,
    errorDepositWrite,
    dataDeposit,
    callDeposit,
    resetState,
    done
  ])

  return (
    <Stack direction="column" spacing="5px" padding={2} alignItems="left">
      <Typography variant="body1" fontWeight="bold">
        {currStep}. Deposit
      </Typography>
      <Typography variant="body2">{depositState.status.message}</Typography>
      {depositState.status.step === State.Sign && !errorDepositWrite && (
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
          <Stack direction="row" gap="10px">
            <StyledButton
              onClick={() => {
                dispatch(
                  actions.setDepositStatus({
                    key: address,
                    status: Steps[State.Prompt]
                  })
                )
                setPrompted(true)
              }}
              disabled={isLoadingDeposit || prompted}
              small
            >
              {prompted ? 'Trying Deposit...' : 'Retry Deposit'}
            </StyledButton>
            <StyledButton
              onClick={() => {
                resetState('')
              }}
              sx={{
                backgroundColor: 'text.primary'
              }}
              small
            >
              Cancel
            </StyledButton>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}

export default Deposit
