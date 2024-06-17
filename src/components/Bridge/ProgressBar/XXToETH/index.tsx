import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useState } from 'react'
import { useQuery } from '@apollo/client'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import { ETH_EXPLORER_URL, XX_EXPLORER_URL } from '@/consts'
import {
  QUERY_PROPOSAL_EVENTS,
  QueryProposalEvents
} from '@/plugins/apollo/schemas'
import StyledButton from '../../../custom/StyledButton'
import { useAppDispatch, useAppSelector } from '@/plugins/redux/hooks'
import { getStateFromAddress } from '@/plugins/redux/selectors'
import { CustomStep, RootState } from '@/plugins/redux/types'
import { actions, emptyState } from '@/plugins/redux/reducers'
import CustomStepper from '../Stepper'
import { useEffectDebugger } from '@/hooks/useUtils'
import NativeTranfer from './NativeTransfer'
import PayFee from './PayFee'

interface TransferXXToETHProps {
  reset: () => void
}

// From XX to ETH: Native Transfer (xx) -> Pay Fee (eth) -> Wait for Bridge -> Done
export enum Steps {
  Idle = 0,
  Init = 1,
  NativeTransfer = 2,
  FeePayment = 3,
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
    step: Steps.NativeTransfer,
    message: 'Transfering XX to Bridge'
  },
  {
    step: Steps.FeePayment,
    message: 'Paying Relayer Fee'
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

const TransferXXToETH: React.FC<TransferXXToETHProps> = ({ reset }) => {
  // Hooks
  const { selectedAccount } = useAccounts()

  // State variables
  const [error, setError] = useState<string | undefined>()

  // use redux
  const currState =
    useAppSelector(
      (state: RootState) =>
        selectedAccount?.address &&
        getStateFromAddress(state, selectedAccount?.address)
    ) || emptyState
  const dispatch = useAppDispatch()

  // Go to error state
  const goError = useCallback((msg: string) => {
    // dispatch(actions.resetKey(selectedAccount?.address))
    setError(msg)
  }, [])

  // Reset state + call prop
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
  /*                                    Hooks                                   */
  /* -------------------------------------------------------------------------- */

  // Query proposal event every 2 seconds when waiting for bridge
  const {
    data: proposalEvent,
    loading: loadingProposalEvent,
    error: errorProposalEvent
    // networkStatus: networkStatusProposalEvent
  } = useQuery<QueryProposalEvents>(QUERY_PROPOSAL_EVENTS, {
    variables: {
      where: {
        _and: [
          { status: { _eq: 'Executed' } },
          {
            nonce: { _eq: currState.fromNative.nativeTransfer.nonce.toString() }
          }
        ]
      }
    },
    pollInterval: 2000,
    skip:
      !currState.fromNative.nativeTransfer.nonce ||
      currState.tx.status.step !== Steps.WaitBridge
  })

  // State machine
  useEffectDebugger(
    () => {
      const executeStep = async () => {
        switch (currState.tx.status.step) {
          /* -------------------------------- Init ------------------------------- */
          case Steps.Init: {
            // Go to native transfer
            dispatch(
              actions.incrementStepTo({
                key: selectedAccount?.address,
                step: State[Steps.NativeTransfer]
              })
            )
            break
          }

          /* ---------------------------- NativeTransfer ---------------------------- */
          case Steps.NativeTransfer: {
            // If native transfer already done go to fee payment
            if (currState.fromNative.nativeTransfer.extrinsicHash) {
              console.log('Native transfer already done, moving to PayFee')
              dispatch(
                actions.incrementStepTo({
                  key: selectedAccount?.address,
                  step: State[Steps.FeePayment]
                })
              )
            }
            // Wait for native transfer to finish
            break
          }

          /* ---------------------------- PayFee ---------------------------- */
          case Steps.FeePayment: {
            // Wait for fee payment to finish
            break
          }

          /* ---------------------------- WaitBridge ---------------------------- */
          case Steps.WaitBridge: {
            // Watch executed event on Bridge smart contract (updated by memoized nonce)
            // TODO: add domain specific event filter
            if (!errorProposalEvent && !loadingProposalEvent && proposalEvent) {
              if (proposalEvent.proposal.length > 0) {
                // Save txHash of bridge transaction
                if (proposalEvent.proposal[0].votes.length > 0) {
                  dispatch(
                    actions.setBridgeTxHash({
                      key: selectedAccount?.address,
                      txHash: proposalEvent.proposal[0].votes[0].txHash
                    })
                  )
                }
                dispatch(
                  actions.incrementStepTo({
                    key: selectedAccount?.address,
                    step: State[Steps.Done]
                  })
                )
              }
            }
            break
          }

          /* ---------------------------- Done ---------------------------- */
          case Steps.Done: {
            setTimeout(() => {
              dispatch(
                actions.incrementStepTo({
                  key: selectedAccount?.address,
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
      if (selectedAccount) {
        console.log('Executing step', currState.tx.status.step)
        executeStep()
      }
    },
    [
      selectedAccount,
      currState.tx.status.step,
      currState.fromNative.nativeTransfer.extrinsicHash,
      errorProposalEvent,
      loadingProposalEvent,
      proposalEvent
    ],
    [
      'selectedAccount',
      'currState.tx.status.step',
      'currState.fromNative.nativeTransfer.extrinsicHash',
      'errorProposalEvent',
      'loadingProposalEvent',
      'proposalEvent'
    ]
  )

  // Handle native transfer done
  const handleNativeTransferDone = useCallback(() => {
    dispatch(
      actions.incrementStepTo({
        key: selectedAccount?.address,
        step: State[Steps.FeePayment]
      })
    )
  }, [selectedAccount])

  // Handle fee payment done
  const handlePayFeeDone = useCallback(() => {
    dispatch(
      actions.incrementStepTo({
        key: selectedAccount?.address,
        step: State[Steps.WaitBridge]
      })
    )
  }, [selectedAccount])

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
              steps={State.filter(state => state.step !== Steps.Idle)}
              activeStep={currState.tx.status.step}
            />
            <Stack
              direction="column"
              spacing="20px"
              padding={2}
              alignItems="left"
            >
              {currState.tx.status.step === Steps.NativeTransfer && (
                <NativeTranfer
                  currStep={Steps.NativeTransfer}
                  setError={handleError}
                  done={handleNativeTransferDone}
                />
              )}
              {currState.tx.status.step === Steps.FeePayment && (
                <PayFee
                  currStep={Steps.FeePayment}
                  setError={handleError}
                  done={handlePayFeeDone}
                />
              )}
              {currState.tx.status.step === Steps.WaitBridge && (
                <Stack direction="column" spacing={1}>
                  <Typography variant="body1" fontWeight="bold">
                    {Steps.WaitBridge}. Waiting for Bridge ...
                  </Typography>
                  <Stack alignSelf="center" sx={{ maxWidth: '80%' }}>
                    <Typography variant="body2">
                      The relayer requires 10 blocks to confirm a deposit, so
                      the bridge operation can take upwards of 2 minutes, please
                      be patient. If it appears that you are stuck on this page,
                      please press the reset button to go back to the home page.
                      This will not affect the transaction.
                    </Typography>
                  </Stack>
                </Stack>
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
                    {Steps.Done}. Transfer complete!
                  </Typography>
                  {currState.fromNative.nativeTransfer.extrinsicHash && (
                    <Link
                      variant="body2"
                      href={`${XX_EXPLORER_URL}/extrinsics/${currState.fromNative.nativeTransfer.extrinsicHash}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View Deposit transaction in xx Explorer
                    </Link>
                  )}
                  {currState.fromNative.feePayment.txHash && (
                    <Link
                      variant="body2"
                      href={`${ETH_EXPLORER_URL}/tx/${currState.fromNative.feePayment.txHash}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View Fee Payment transaction in Etherscan
                    </Link>
                  )}
                  {currState.bridgeTxHash && (
                    <Link
                      variant="body2"
                      href={`${ETH_EXPLORER_URL}/tx/${currState.bridgeTxHash}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View Bridge transaction in Etherscan
                    </Link>
                  )}
                  <StyledButton
                    onClick={() => {
                      dispatch(actions.resetKey(selectedAccount?.address))
                      resetState()
                    }}
                  >
                    Go Back
                  </StyledButton>
                </Stack>
              )}
            </Stack>
          </Stack>
          {currState.tx.status.step === Steps.WaitBridge && (
            <Stack justifyContent="right" padding={2}>
              <StyledButton
                small
                onClick={() => {
                  dispatch(actions.resetKey(selectedAccount?.address))
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

export default TransferXXToETH
