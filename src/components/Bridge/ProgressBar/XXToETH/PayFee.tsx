import { Stack, Typography } from '@mui/material'
import React, { useCallback, useRef, useState } from 'react'
import { readContract, waitForTransactionReceipt } from 'wagmi/actions'
import contracts from '@/contracts'
import {
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RELAYER_FEE_ADDRESS,
  CONFIRMATIONS_THRESHOLD
} from '@/consts'
import StyledButton from '@/components/custom/StyledButton'
import { CustomStep, RootState } from '@/plugins/redux/types'
import { useAppSelector, useAppDispatch } from '@/plugins/redux/hooks'
import { actions, emptyState } from '@/plugins/redux/reducers'
import {
  getFeePaymentFromAddress,
  getNativeTransferFromAddress
} from '@/plugins/redux/selectors'
import customWriteContract from '@/utils/promises'
import { useEffectDebugger } from '@/hooks/useUtils'
import { wagmiConfig } from '@/plugins/wagmi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'

interface PayFeeProps {
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
    message: 'Fee Payment complete'
  }
]

const PayFee: React.FC<PayFeeProps> = ({ currStep, setError, done }) => {
  // Hooks
  const { selectedAccount } = useAccounts()
  const prompted = useRef<boolean | undefined>()
  const [feePaymentError, setFeePaymentError] = useState<string>('')

  // use redux
  const nativeTransferState =
    useAppSelector(
      (state: RootState) =>
        selectedAccount?.address &&
        getNativeTransferFromAddress(state, selectedAccount?.address)
    ) || emptyState.fromNative.nativeTransfer
  const feePaymentState =
    useAppSelector(
      (state: RootState) =>
        selectedAccount?.address &&
        getFeePaymentFromAddress(state, selectedAccount?.address)
    ) || emptyState.fromNative.feePayment
  const dispatch = useAppDispatch()

  // Get current relayer fee from contract
  const fetchRelayerFee = useCallback(async () => {
    try {
      const relayerFee = await readContract(wagmiConfig, {
        address: BRIDGE_RELAYER_FEE_ADDRESS,
        abi: contracts.relayerFeeAbi,
        functionName: 'currentFee'
      })
      return relayerFee
    } catch (err) {
      console.error('Error reading contract:', err)
      return null
    }
  }, [])

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      // No need to call resetKeys here, since we are only resetting the fee payment state
      setError(msg)
    },
    [setError]
  )

  // State machine
  useEffectDebugger(
    () => {
      const executeStep = async () => {
        switch (feePaymentState.status.step) {
          /* -------------------------------- Init ------------------------------- */
          case State.Init: {
            // if fee payment tx hash exists on local storage go to wait state
            if (feePaymentState.txHash) {
              dispatch(
                actions.setFeePaymentStatus({
                  key: selectedAccount?.address,
                  status: Steps[State.Wait]
                })
              )
            } else {
              dispatch(
                actions.setFeePaymentStatus({
                  key: selectedAccount?.address,
                  status: Steps[State.Prompt]
                })
              )
            }
            break
          }

          /* -------------------------------- Prompt ----------------------------- */
          case State.Prompt: {
            // if fee payment tx hash exists on local storage go to wait state
            if (feePaymentState.txHash) {
              console.log(
                'In Prompt, but txHash exists so move to Wait',
                feePaymentState
              )
              dispatch(
                actions.setFeePaymentStatus({
                  key: selectedAccount?.address,
                  status: Steps[State.Wait]
                })
              )
              break
            }

            // if not prompted, prompt user
            console.log(`Prompting user to pay fee...`, feePaymentState)
            const relayerFee = await fetchRelayerFee()
            if (
              nativeTransferState &&
              nativeTransferState.nonce &&
              relayerFee &&
              !prompted.current &&
              !feePaymentError
            ) {
              prompted.current = true
              try {
                const hash = await customWriteContract({
                  address: BRIDGE_RELAYER_FEE_ADDRESS,
                  abi: contracts.relayerFeeAbi,
                  functionName: 'payFee',
                  args: [
                    BRIDGE_ID_XXNETWORK,
                    BigInt(nativeTransferState.nonce)
                  ],
                  value: relayerFee
                })
                dispatch(
                  actions.setFeePaymentTxHash({
                    key: selectedAccount?.address,
                    hash
                  })
                )
                dispatch(
                  actions.setFeePaymentStatus({
                    key: selectedAccount?.address,
                    status: Steps[State.Wait]
                  })
                )
              } catch (err) {
                console.error(`Error paying fee: ${err}`)
                setFeePaymentError(
                  `Error paying fee: User rejected transaction`
                )
              }
              prompted.current = false
            }
            break
          }

          /* -------------------------------- Wait ------------------------------- */
          case State.Wait: {
            console.log(
              `Waiting for fee payment block confirmations (3)...`,
              feePaymentState
            )
            if (feePaymentState.txHash) {
              try {
                console.log(`Waiting for fee payment:`, feePaymentState.txHash)
                const receipt = await waitForTransactionReceipt(wagmiConfig, {
                  hash: feePaymentState.txHash as `0x${string}`,
                  confirmations: CONFIRMATIONS_THRESHOLD
                })
                if (receipt) {
                  console.log(`Fee payment receipt:`, receipt)
                  dispatch(
                    actions.setFeePaymentStatus({
                      key: selectedAccount?.address,
                      status: Steps[State.Done]
                    })
                  )
                }
              } catch (err: any) {
                console.error(`Error waiting for fee payment: ${err}`)
                resetState(`Error waiting for fee payment: ${err.message}`)
              }
            }
            break
          }

          /* -------------------------------- Done ------------------------------- */
          case State.Done: {
            console.log(`Fee payment complete`)
            done()
            break
          }

          /* -------------------------------------------------------------------------- */
          default:
            throw new Error(`Unknown step: ${feePaymentState.status.step}`)
        }
      }
      if (selectedAccount?.address && feePaymentState) {
        executeStep()
      }
    },
    [
      selectedAccount,
      feePaymentState,
      dispatch,
      done,
      fetchRelayerFee,
      prompted.current,
      resetState,
      setError,
      nativeTransferState
    ],
    [
      'selectedAccount',
      'feePaymentState',
      'dispatch',
      'done',
      'fetchRelayerFee',
      'prompted.current',
      'resetState',
      'setError',
      'nativeTransferState'
    ]
  )

  return (
    <Stack direction="column" spacing="5px" padding={2} alignItems="left">
      <Typography variant="body1" fontWeight="bold">
        {currStep}. Fee Payment
      </Typography>
      <Typography variant="body2">{feePaymentState.status.message}</Typography>
      {feePaymentState.status.step === State.Prompt && (
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
          {feePaymentError && (
            <Typography variant="body2" sx={{ color: 'red' }}>
              {feePaymentError}
            </Typography>
          )}
          <Stack direction="row" gap="10px">
            <StyledButton
              onClick={() => {
                // reset fee payment error
                setFeePaymentError('')
                // set prompted to undefined
                prompted.current = undefined
                // set fee payment status to prompt
                dispatch(
                  actions.setFeePaymentStatus({
                    key: selectedAccount?.address,
                    status: Steps[State.Prompt]
                  })
                )
              }}
              disabled={prompted.current !== false}
              small
            >
              {prompted.current !== false
                ? 'Trying Fee Payment...'
                : 'Retry Fee Payment'}
            </StyledButton>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}

export default PayFee
