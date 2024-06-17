import { Stack, Typography } from '@mui/material'
import React, { useCallback, useRef, useState } from 'react'
import { BRIDGE_ID_ETH_MAINNET } from '@/consts'
import StyledButton from '@/components/custom/StyledButton'
import { CustomStep, RootState } from '@/plugins/redux/types'
import { useAppSelector, useAppDispatch } from '@/plugins/redux/hooks'
import { actions, emptyState } from '@/plugins/redux/reducers'
import {
  getNativeTransferFromAddress,
  getTxFromAddress
} from '@/plugins/redux/selectors'
import { useEffectDebugger } from '@/hooks/useUtils'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import useApi from '@/plugins/substrate/hooks/useApi'

interface NativeTransferProps {
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
    message: 'Waiting for block inclusion...'
  },
  {
    step: State.Done,
    message: 'Native Transfer complete'
  }
]

const NativeTranfer: React.FC<NativeTransferProps> = ({
  currStep,
  setError,
  done
}) => {
  // Hooks
  const { selectedAccount, getSigner } = useAccounts()
  const { api, ready } = useApi()
  const prompted = useRef<boolean | undefined>()
  const [nativeTransferError, setNativeTransferError] = useState<string>('')

  // use redux
  const tx =
    useAppSelector(
      (state: RootState) =>
        selectedAccount?.address &&
        getTxFromAddress(state, selectedAccount?.address)
    ) || emptyState.tx
  const nativeTransferState =
    useAppSelector(
      (state: RootState) =>
        selectedAccount?.address &&
        getNativeTransferFromAddress(state, selectedAccount?.address)
    ) || emptyState.fromNative.nativeTransfer
  const dispatch = useAppDispatch()

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      // No need to call resetKeys here, since we are only resetting the native transfer state
      setError(msg)
    },
    [setError]
  )

  // State machine
  useEffectDebugger(
    () => {
      const executeStep = async () => {
        switch (nativeTransferState.status.step) {
          /* -------------------------------- Init ------------------------------- */
          case State.Init: {
            // if nonce exists on local storage go to wait state
            if (nativeTransferState.nonce) {
              dispatch(
                actions.setNativeTransferStatus({
                  key: selectedAccount?.address,
                  status: Steps[State.Wait]
                })
              )
            } else {
              dispatch(
                actions.setNativeTransferStatus({
                  key: selectedAccount?.address,
                  status: Steps[State.Prompt]
                })
              )
            }
            break
          }

          /* -------------------------------- Prompt ----------------------------- */
          case State.Prompt: {
            // if nonce exists on local storage go to wait state
            if (nativeTransferState.nonce) {
              console.log(
                'In Prompt, but nonce exists so move to Wait',
                nativeTransferState
              )
              dispatch(
                actions.setNativeTransferStatus({
                  key: selectedAccount?.address,
                  status: Steps[State.Wait]
                })
              )
              break
            }

            // check if api is ready
            if (!api || !ready) {
              setNativeTransferError('API not ready')
              break
            }
            // check if selected account is available
            if (!selectedAccount) {
              setNativeTransferError('No account selected')
              break
            }

            if (!prompted.current) {
              const extrinsic = api.tx.swap.transferNative(
                BigInt(tx?.amount ?? 0),
                tx?.destinationAddress ?? '',
                BRIDGE_ID_ETH_MAINNET
              )
              const signer = getSigner()
              if (signer) {
                prompted.current = true
                extrinsic
                  .signAndSend(
                    selectedAccount.address,
                    { signer },
                    ({ status, events, txHash }) => {
                      if (status.isInBlock) {
                        events.forEach(({ event }) => {
                          if (
                            api.events.chainBridge.FungibleTransfer.is(event)
                          ) {
                            const [, nonceValue] = event.data
                            dispatch(
                              actions.setNativeTransferData({
                                key: selectedAccount?.address,
                                nonce: nonceValue.toNumber(),
                                extrinsicHash: txHash.toString()
                              })
                            )
                          }
                        })
                      }
                    }
                  )
                  .then(() => {
                    dispatch(
                      actions.setNativeTransferStatus({
                        key: selectedAccount?.address,
                        status: Steps[State.Wait]
                      })
                    )
                    prompted.current = false
                  })
                  .catch(err => {
                    setNativeTransferError(
                      `Error executing transferNative: ${err.message}`
                    )
                    prompted.current = false
                  })
              } else {
                setNativeTransferError('No signer available')
              }
            }
            break
          }

          /* -------------------------------- Wait ------------------------------- */
          case State.Wait: {
            console.log(
              `Waiting for native transfer block inclusion...`,
              nativeTransferState
            )
            if (nativeTransferState.nonce) {
              dispatch(
                actions.setNativeTransferStatus({
                  key: selectedAccount?.address,
                  status: Steps[State.Done]
                })
              )
            }
            break
          }

          /* -------------------------------- Done ------------------------------- */
          case State.Done: {
            console.log(`Native transfer complete`)
            done()
            break
          }

          /* -------------------------------------------------------------------------- */
          default:
            throw new Error(`Unknown step: ${nativeTransferState.status.step}`)
        }
      }
      if (api && ready && selectedAccount) {
        executeStep()
      }
    },
    [
      selectedAccount,
      nativeTransferState,
      dispatch,
      done,
      prompted.current,
      resetState,
      setError,
      tx
    ],
    [
      'selectedAccount',
      'nativeTransferState',
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
        {currStep}. Native Transfer
      </Typography>
      <Typography variant="body2">
        {nativeTransferState.status.message}
      </Typography>
      {nativeTransferState.status.step === State.Prompt && (
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
          {nativeTransferError && (
            <Typography variant="body2" sx={{ color: 'red' }}>
              {nativeTransferError}
            </Typography>
          )}
          <Stack direction="row" gap="10px">
            <StyledButton
              onClick={() => {
                // reset native transfer error
                setNativeTransferError('')
                // set native transfer to undefined
                prompted.current = undefined
                // set native transfer status to prompt
                dispatch(
                  actions.setNativeTransferStatus({
                    key: selectedAccount?.address,
                    status: Steps[State.Prompt]
                  })
                )
              }}
              disabled={prompted.current !== false}
              small
            >
              {prompted.current !== false
                ? 'Trying Native Transfer...'
                : 'Retry Native Transfer'}
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

export default NativeTranfer
