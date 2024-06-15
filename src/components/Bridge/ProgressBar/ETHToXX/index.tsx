import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { useAccount } from 'wagmi'
import Approve from './Approve'
import Deposit from './Deposit'
import {
  QUERY_BRIDGE_EVENTS,
  QUERY_DEPOSIT_NONCE,
  QueryBridgeEvents,
  QueryDepositNonce
} from '@/plugins/apollo/schemas'
import {
  BRIDGE_ID_ETH_MAINNET,
  ETH_EXPLORER_URL,
  XX_EXPLORER_URL
} from '@/consts'
import xxClient from '@/plugins/apollo/xx'
import StyledButton from '../../../custom/StyledButton'
import CustomStepper from '../Stepper'
import { useAppSelector, useAppDispatch } from '@/plugins/redux/hooks'
import { actions, emptyState } from '@/plugins/redux/reducers'
import { CustomStep, RootState } from '@/plugins/redux/types'
import { getStateFromAddress } from '@/plugins/redux/selectors'
import { useEffectDebugger } from '@/hooks/useUtils'

interface TransferETHToXXProps {
  reset: () => void
}

export enum Steps {
  Idle = 0,
  Init = 1,
  ApproveSpend = 2,
  BridgeDeposit = 3,
  WaitBridge = 4,
  Done = 5
}

export const State: CustomStep[] = [
  {
    step: Steps.Idle,
    message: 'Idle'
  },
  {
    step: Steps.Init,
    message: 'Initializing transfer'
  },
  {
    step: Steps.ApproveSpend,
    message: 'Approving spending'
  },
  {
    step: Steps.BridgeDeposit,
    message: 'Depositing WXX to Bridge'
  },
  {
    step: Steps.WaitBridge,
    message: 'Waiting for Bridge'
  },
  {
    step: Steps.Done,
    message: 'Completing Transfer'
  }
]

const TransferETHToXX: React.FC<TransferETHToXXProps> = ({ reset }) => {
  const { address } = useAccount()
  const [error, setError] = useState<string | undefined>()

  // use redux
  const currState =
    useAppSelector(
      (state: RootState) => address && getStateFromAddress(state, address)
    ) || emptyState
  const dispatch = useAppDispatch()

  // Go to error state
  const goError = useCallback((msg: string) => {
    // dispatch(actions.resetKey(address))
    setError(msg)
  }, [])

  // Reset state and go back to home page
  const resetState = useCallback(() => {
    setError(undefined)
    reset()
  }, [reset])

  // Handle error from children
  // If empty message, just reset state
  const handleError = useCallback(
    (msg: string) => {
      if (msg !== '') {
        goError(msg)
      } else {
        resetState()
      }
    },
    [goError, resetState]
  )

  /* -------------------------------------------------------------------------- */
  /*                               WaitBridge Step                              */
  /* -------------------------------------------------------------------------- */
  // Watch deposit nonce (evm indexer)
  const { data: depositNonce, error: errorDepositNonce } =
    useQuery<QueryDepositNonce>(QUERY_DEPOSIT_NONCE, {
      variables: {
        where: {
          txn_hash: { _eq: currState.toNative.deposit.txHash }
        }
      },
      pollInterval: 2000,
      skip:
        !currState.toNative.deposit.txHash ||
        currState.tx.status.step !== Steps.WaitBridge
    })

  // process deposit nonce
  const dataEvent = useMemo(() => {
    console.log('MEMO DATA EVENT = depositNonce', depositNonce)
    if (depositNonce && depositNonce.deposit.length > 0) {
      console.log(
        'MEMO DATA EVENT = depositNonce.deposit[0].nonce',
        depositNonce.deposit[0].nonce
      )
      return `[${BRIDGE_ID_ETH_MAINNET},${depositNonce.deposit[0].nonce}]`
    }
    return ''
  }, [depositNonce])

  // Watch executed event on Bridge smart contract (xx indexer)
  const { data: bridgeEvent, error: errorBridgeEvent } =
    useQuery<QueryBridgeEvents>(QUERY_BRIDGE_EVENTS, {
      client: xxClient,
      variables: {
        where: {
          _and: [
            { module: { _eq: 'chainBridge' } },
            { call: { _eq: 'ProposalSucceeded' } },
            { data: { _eq: dataEvent } }
          ]
        }
      },
      pollInterval: 2000,
      skip: !dataEvent || currState.tx.status.step !== Steps.WaitBridge
    })

  /* ------------------------------------ - ----------------------------------- */

  // State machine
  useEffectDebugger(
    () => {
      const executeStep = async () => {
        switch (currState.tx.status.step) {
          /* -------------------------------- Init ------------------------------- */
          case Steps.Init: {
            // Go to approve if needed, otherwise go to deposit
            if (currState.tx.needApproval) {
              console.log('Need to approve')
              dispatch(
                actions.incrementStepTo({
                  key: address,
                  step: State[Steps.ApproveSpend]
                })
              )
            } else {
              console.log('No need to approve')
              dispatch(
                actions.incrementStepTo({
                  key: address,
                  step: State[Steps.BridgeDeposit]
                })
              )
            }
            break
          }

          /* ---------------------------- ApproveSpend ---------------------------- */
          case Steps.ApproveSpend: {
            console.log('Approving spending...')
            // If approval already made go to deposit
            if (!currState.tx.needApproval) {
              console.log('No need to approve')
              dispatch(
                actions.incrementStepTo({
                  key: address,
                  step: State[Steps.BridgeDeposit]
                })
              )
            }
            // Wait for Approval to finish
            break
          }

          /* ---------------------------- BridgeDeposit ---------------------------- */
          case Steps.BridgeDeposit: {
            // Wait for Bridge deposit to finish
            if (errorDepositNonce) {
              console.log(`Error getting deposit nonce: ${errorDepositNonce}`)
              goError(`Couldn't get deposit nonce: ${errorDepositNonce}`)
            }
            break
          }

          /* ---------------------------- WaitBridge ---------------------------- */
          case Steps.WaitBridge: {
            console.log('Waiting for bridge event...', bridgeEvent)
            // Check if bridge event is emitted
            if (!errorBridgeEvent && bridgeEvent) {
              if (bridgeEvent.event.length > 0) {
                const block = bridgeEvent.event[0].blockNumber
                const extrinsicIdx = JSON.parse(bridgeEvent.event[0].phase)
                  .applyExtrinsic as number
                const extrinsic = `${block}-${extrinsicIdx}`
                // Save txHash of bridge transaction
                // Note: block-idx is equivalent to ext hash in xx explorer
                dispatch(
                  actions.setBridgeTxHash({
                    key: address,
                    txHash: extrinsic
                  })
                )
                dispatch(
                  actions.incrementStepTo({
                    key: address,
                    step: State[Steps.Done]
                  })
                )
              }
            }
            if (errorBridgeEvent) {
              console.log(`Error getting bridge event: ${errorBridgeEvent}`)
              goError(`Couldn't get bridge event: ${errorBridgeEvent}`)
            }
            break
          }

          /* ---------------------------- Done ---------------------------- */
          case Steps.Done: {
            setTimeout(() => {
              dispatch(
                actions.incrementStepTo({
                  key: address,
                  step: {
                    step: Steps.Done + 1,
                    message: 'Transfer complete!'
                  }
                })
              )
            }, 2000)
            break
          }

          /* -------------------------------------------------------------------------- */
          default:
            console.log(`Unknown step: ${currState.tx.status.step}`)
            break
        }
      }
      if (address) {
        console.log('Executing step', currState.tx.status.step)
        executeStep()
      }
    },
    [
      address,
      currState.tx.status.step,
      currState.tx.needApproval,
      currState.toNative.deposit.txHash,
      depositNonce,
      bridgeEvent,
      errorDepositNonce,
      errorBridgeEvent
    ],
    [
      'address',
      'currState.tx.status.step',
      'currState.tx.needApproval',
      'currState.toNative.deposit.txHash',
      'depositNonce',
      'bridgeEvent',
      'errorDepositNonce',
      'errorBridgeEvent'
    ]
  )

  // Handle deposit done
  const handleDepositDone = useCallback(() => {
    dispatch(
      actions.incrementStepTo({
        key: address,
        step: State[Steps.WaitBridge]
      })
    )
  }, [address])

  // Handle approve done
  const handleApproveDone = useCallback(() => {
    dispatch(
      actions.incrementStepTo({
        key: address,
        step: State[Steps.BridgeDeposit]
      })
    )
  }, [address])

  return (
    <>
      {error ? (
        <Stack
          direction="column"
          spacing="10px"
          padding={2}
          alignItems="center"
        >
          <Typography color="error" variant="h5" fontWeight="bold">
            Something went wrong
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
          <StyledButton
            sx={{ marginTop: '20px !important' }}
            onClick={() => {
              resetState()
            }}
          >
            Go Back
          </StyledButton>
        </Stack>
      ) : (
        <>
          <Stack direction="column" padding={2} spacing="20px">
            <CustomStepper
              steps={
                currState.tx.needApproval
                  ? State.filter(state => state.step !== Steps.Idle)
                  : State.filter(
                      state =>
                        state.step !== Steps.ApproveSpend &&
                        state.step !== Steps.Idle
                    ).map(state =>
                      state.step < Steps.ApproveSpend
                        ? state
                        : { step: state.step - 1, message: state.message }
                    )
              }
              activeStep={
                currState.tx.needApproval
                  ? currState.tx.status.step
                  : currState.tx.status.step - 1
              }
            />
            <Stack
              direction="column"
              spacing="20px"
              padding={2}
              alignItems="left"
            >
              {currState.tx.needApproval &&
                currState.tx.status.step === Steps.ApproveSpend && (
                  <Approve
                    currStep={Steps.ApproveSpend}
                    setError={handleError}
                    done={handleApproveDone}
                  />
                )}
              {currState.tx.status.step === Steps.BridgeDeposit && (
                <Deposit
                  currStep={
                    currState.tx.needApproval
                      ? Steps.BridgeDeposit
                      : Steps.BridgeDeposit - 1
                  }
                  setError={handleError}
                  done={handleDepositDone}
                />
              )}
              {currState.tx.status.step === Steps.WaitBridge && (
                <>
                  <Typography variant="body1" fontWeight="bold">
                    {currState.tx.needApproval
                      ? Steps.WaitBridge
                      : Steps.WaitBridge - 1}
                    . Waiting for Bridge ...
                  </Typography>
                  <Typography variant="body2">
                    The relayer requires 10 blocks to confirm a deposit, so the
                    bridge operation can take upwards of 2 minutes, please be
                    patient.
                  </Typography>
                </>
              )}
              {currState.tx.status.step >= Steps.Done && (
                <Stack
                  sx={{
                    flexDirection: 'column'
                  }}
                  alignItems="center"
                  spacing="20px"
                >
                  <Typography variant="h5" fontWeight="bold">
                    {currState.tx.needApproval ? Steps.Done : Steps.Done - 1}.
                    Transfer complete!
                  </Typography>
                  {currState.toNative.deposit.txHash && (
                    <Link
                      variant="body2"
                      href={`${ETH_EXPLORER_URL}/tx/${currState.toNative.deposit.txHash}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View Deposit transaction in Etherscan
                    </Link>
                  )}
                  {currState.bridgeTxHash && (
                    <Link
                      variant="body2"
                      href={`${XX_EXPLORER_URL}/extrinsics/${currState.bridgeTxHash}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View Bridge transaction in xx Explorer
                    </Link>
                  )}
                  <StyledButton
                    onClick={() => {
                      dispatch(actions.resetKey(address))
                      resetState()
                    }}
                  >
                    Go Back
                  </StyledButton>
                </Stack>
              )}
            </Stack>
          </Stack>
          {currState.tx.status.step < Steps.Done && (
            <Stack justifyContent="right" padding={2}>
              <StyledButton
                small
                onClick={() => {
                  dispatch(actions.resetKey(address))
                  resetState()
                }}
              >
                Reset
              </StyledButton>
            </Stack>
          )}
        </>
      )}
    </>
  )
}

export default TransferETHToXX
