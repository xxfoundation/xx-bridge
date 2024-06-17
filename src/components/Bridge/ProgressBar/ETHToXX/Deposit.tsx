import { Stack, Typography } from '@mui/material'
import React, { useCallback, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import contracts from '@/contracts'
import {
  BRIDGE_ADDRESS,
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RESOURCE_ID_XX,
  CONFIRMATIONS_THRESHOLD
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
import customWriteContract from '@/utils/promises'
import { useEffectDebugger } from '@/hooks/useUtils'
import { wagmiConfig } from '@/plugins/wagmi'

interface DepositProps {
  currStep: number
  setError: (message: string) => void
  done: () => void
}

enum State {
  Init = 0,
  Prompt = 1,
  Wait = 2,
  Done = 3
}

const Steps: CustomStep[] = [
  {
    step: State.Init,
    message: 'Initializing...'
  },
  {
    step: State.Prompt,
    message: 'Waiting for signature...'
  },
  {
    step: State.Wait,
    message: 'Waiting for block confirmations (3)...'
  },
  {
    step: State.Done,
    message: 'Deposit complete'
  }
]

const Deposit: React.FC<DepositProps> = ({ currStep, setError, done }) => {
  // Hooks
  const { address } = useAccount()
  const prompted = useRef<boolean | undefined>()
  const [depositError, setDepositError] = useState<string>('')

  // use redux
  const tx = useAppSelector(
    (state: RootState) => address && getTxFromAddress(state, address)
  )
  const depositState =
    useAppSelector(
      (state: RootState) => address && getDepositFromAddress(state, address)
    ) || emptyState.toNative.deposit
  const dispatch = useAppDispatch()

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      // No need to call resetKeys here, since we are only resetting the deposit state
      setError(msg)
    },
    [setError]
  )

  // State machine
  useEffectDebugger(
    () => {
      const executeStep = async () => {
        switch (depositState.status.step) {
          /* -------------------------------- Init ------------------------------- */
          case State.Init: {
            // if deposit tx hash exists on local storage go to wait state
            if (depositState.txHash) {
              dispatch(
                actions.setDepositStatus({
                  key: address,
                  status: Steps[State.Wait]
                })
              )
            } else {
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
            // if deposit tx hash exists on local storage go to wait state
            if (depositState.txHash) {
              console.log(
                'In Prompt, but txHash exists so move to Wait',
                depositState
              )
              dispatch(
                actions.setDepositStatus({
                  key: address,
                  status: Steps[State.Wait]
                })
              )
              break
            }

            // if not prompted, prompt user
            console.log(`Prompting user to deposit...`, depositState)
            if (tx) {
              const deposit = encodeBridgeDeposit(
                tx.destinationAddress,
                BigInt(tx.amount)
              )
              if (deposit) {
                if (!prompted.current && !depositError) {
                  prompted.current = true
                  try {
                    const hash = await customWriteContract({
                      address: BRIDGE_ADDRESS,
                      abi: contracts.bridgeAbi,
                      functionName: 'deposit',
                      args: [
                        BRIDGE_ID_XXNETWORK,
                        BRIDGE_RESOURCE_ID_XX,
                        deposit
                      ]
                    })
                    dispatch(
                      actions.setDepositTxHash({
                        key: address,
                        hash
                      })
                    )
                    dispatch(
                      actions.setDepositStatus({
                        key: address,
                        status: Steps[State.Wait]
                      })
                    )
                  } catch (err) {
                    console.error(`Error depositing: ${err}`)
                    setDepositError(
                      `Error depositing: User rejected transaction`
                    )
                  }
                  prompted.current = false
                }
              } else {
                console.error(`Error encoding deposit`)
                resetState(`Error encoding deposit`)
              }
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
                const depositReceipt = await waitForTransactionReceipt(
                  wagmiConfig,
                  {
                    hash: depositState.txHash as `0x${string}`,
                    confirmations: CONFIRMATIONS_THRESHOLD
                  }
                )
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
    },
    [
      address,
      depositState,
      dispatch,
      done,
      prompted.current,
      resetState,
      setError,
      tx
    ],
    [
      'address',
      'depositState',
      'dispatch',
      'done',
      'prompted.current',
      'resetState',
      'setError',
      'tx'
    ]
  )

  return (
    <Stack direction="column" spacing="5px" padding={2} alignItems="left">
      <Typography variant="body1" fontWeight="bold">
        {currStep}. Deposit
      </Typography>
      <Typography variant="body2">{depositState.status.message}</Typography>
      {depositState.status.step === State.Prompt && (
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
          {depositError && (
            <Typography variant="body2" sx={{ color: 'red' }}>
              {depositError}
            </Typography>
          )}
          <Stack direction="row" gap="10px">
            <StyledButton
              onClick={() => {
                // reset deposit error
                setDepositError('')
                // set prompted to undefined
                prompted.current = undefined
                // set deposit status to prompt
                dispatch(
                  actions.setDepositStatus({
                    key: address,
                    status: Steps[State.Prompt]
                  })
                )
              }}
              disabled={prompted.current !== false}
              small
            >
              {prompted.current !== false
                ? 'Trying Deposit...'
                : 'Retry Deposit'}
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
