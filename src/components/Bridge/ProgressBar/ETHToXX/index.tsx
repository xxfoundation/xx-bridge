import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSubscription } from '@apollo/client'
import { useAccount } from 'wagmi'
import Approve from './Approve'
import Deposit from './Deposit'
import {
  SUB_BRIDGE_EVENTS,
  SUB_DEPOSIT_NONCE,
  SubBridgeEvents,
  SubDepositNonce
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
  Init = 0,
  ApproveSpend = 1,
  BridgeDeposit = 2,
  WaitBridge = 3,
  Done = 4,
  Complete = 5
}

export const State: CustomStep[] = [
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
    message: 'Depositing to bridge'
  },
  {
    step: Steps.WaitBridge,
    message: 'Waiting for bridge'
  },
  {
    step: Steps.Done,
    message: 'Completing Transfer'
  }
]

const TransferETHToXX: React.FC<TransferETHToXXProps> = ({ reset }) => {
  const { address } = useAccount()
  const [error, setError] = useState<string | undefined>()
  const [extrinsic, setExtrinsic] = useState<string>()

  // use redux
  const transactions = useAppSelector((state: RootState) => state.transactions)
  const currState =
    useAppSelector(
      (state: RootState) => address && getStateFromAddress(state, address)
    ) || emptyState
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (address) {
      if (Object.prototype.hasOwnProperty.call(transactions, address)) {
        console.log('Key already exists', address)
        return
      }
      dispatch(actions.newKey(address))
    }
  }, [address])

  // Go to error state
  const goError = useCallback((msg: string) => {
    // dispatch(actions.resetKey(address))
    setError(msg)
  }, [])

  // Reset state and go back to home page
  const resetState = useCallback(() => {
    setError(undefined)
    setExtrinsic(undefined)
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

  const txHash = useMemo(() => {
    console.log('depositTxHash', currState.toNative.deposit.txHash)
    return currState.toNative.deposit.txHash || ''
  }, [currState])

  // Get on-chain deposit nonce
  const { data: depositNonce, error: errorDepositNonce } =
    useSubscription<SubDepositNonce>(SUB_DEPOSIT_NONCE, {
      variables: {
        where: {
          txn_hash: { _eq: txHash }
        }
      }
    })

  // process deposit nonce
  const dataEvent = useMemo(() => {
    if (depositNonce && depositNonce.deposit.length > 0) {
      console.log(
        'depositNonce',
        `[${BRIDGE_ID_ETH_MAINNET},${depositNonce.deposit[0].nonce}]`
      )
      return `[${BRIDGE_ID_ETH_MAINNET},${depositNonce.deposit[0].nonce}]`
    }
    return ''
  }, [depositNonce])

  // Watch executed event on Bridge smart contract (xx indexer)
  const { data: bridgeEvent, error: errorBridgeEvent } =
    useSubscription<SubBridgeEvents>(SUB_BRIDGE_EVENTS, {
      client: xxClient,
      variables: {
        where: {
          _and: [
            { module: { _eq: 'chainBridge' } },
            { call: { _eq: 'ProposalSucceeded' } },
            { data: { _eq: dataEvent } }
          ]
        }
      }
    })

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
            break
          }

          /* ---------------------------- WaitBridge ---------------------------- */
          case Steps.WaitBridge: {
            console.log('Waiting for bridge event...')
            console.log('bridgeEvent', bridgeEvent)
            // Check if bridge event is emitted
            if (!errorDepositNonce && !errorBridgeEvent && bridgeEvent) {
              if (bridgeEvent.event.length > 0) {
                const block = bridgeEvent.event[0].blockNumber
                const extrinsicIdx = JSON.parse(bridgeEvent.event[0].phase)
                  .applyExtrinsic as number
                setExtrinsic(`${block}-${extrinsicIdx}`)
                dispatch(
                  actions.incrementStepTo({
                    key: address,
                    step: State[Steps.Done]
                  })
                )
              }
            }
            if (errorDepositNonce) {
              console.log(`Error getting deposit nonce: ${errorDepositNonce}`)
              goError(`Couldn't get deposit nonce: ${errorDepositNonce}`)
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
      errorDepositNonce,
      errorBridgeEvent,
      bridgeEvent,
      currState,
      goError,
      reset
    ],
    [
      'address',
      'recipient',
      'amount',
      'approve',
      'errorDepositNonce',
      'errorBridgeEvent',
      'bridgeEvent',
      'currState',
      'goError',
      'reset'
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
                  ? State
                  : State.filter(state => state.step !== Steps.ApproveSpend)
              }
              activeStep={currState.tx.status.step}
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
                    currStep={Steps.ApproveSpend + 1}
                    setError={handleError}
                    done={handleApproveDone}
                  />
                )}
              {currState.tx.status.step === Steps.BridgeDeposit && (
                <Deposit
                  currStep={Steps.BridgeDeposit + 1}
                  setError={handleError}
                  done={handleDepositDone}
                />
              )}
              {currState.tx.status.step === Steps.WaitBridge && (
                <Typography variant="body1" fontWeight="bold">
                  {Steps.WaitBridge + 1}. Waiting for Bridge ...
                </Typography>
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
                    {Steps.Done + 1}. Transfer complete!
                  </Typography>
                  <Link
                    variant="body2"
                    href={`${XX_EXPLORER_URL}/extrinsics/${extrinsic}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View transaction in xx Explorer
                  </Link>
                  <Link
                    variant="body2"
                    href={`${ETH_EXPLORER_URL}/tx/${txHash}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View transaction in Etherscan
                  </Link>
                  <StyledButton
                    onClick={() => {
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
