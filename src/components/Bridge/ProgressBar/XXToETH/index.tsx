import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { readContract, waitForTransaction } from 'wagmi/actions'
import { useQuery } from '@apollo/client'
import { Info } from '@mui/icons-material'
import useApi from '@/plugins/substrate/hooks/useApi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import {
  BRIDGE_ID_ETH_MAINNET,
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RELAYER_FEE_ADDRESS,
  CONFIRMATIONS_THRESHOLD,
  ETH_EXPLORER_URL
} from '@/consts'
import contracts from '@/contracts'
import {
  SUB_PROPOSAL_EVENTS,
  SubProposalEvents
} from '@/plugins/apollo/schemas'
import StyledButton from '../../../custom/StyledButton'
import { useAppDispatch, useAppSelector } from '@/plugins/redux/hooks'
import {
  getFromNativeFromAddress,
  getTxFromAddress
} from '@/plugins/redux/selectors'
import { CustomStep, RootState } from '@/plugins/redux/types'
import { actions, emptyState } from '@/plugins/redux/reducers'
import CustomStepper from '../Stepper'
import { useEffectDebugger } from '@/hooks/useUtils'
import customWriteContract from '@/utils/promises'
import CustomTooltip from '@/plugins/substrate/components/Tooltip'

interface TransferXXToETHProps {
  reset: () => void
}

// From XX to ETH: Native Transfer (xx) -> Pay Fee (eth) -> Wait for Bridge -> Done
export enum Steps {
  Idle = 0,
  Init = 1,
  NativeTransfer = 2,
  PromptRelayerFee = 3,
  WaitFee = 4,
  WaitBridge = 5,
  Done = 6
}

export const State: CustomStep[] = [
  {
    step: Steps.Idle,
    message: 'Idle'
  },
  {
    step: Steps.Init,
    message: 'Initializing transfer...'
  },
  {
    step: Steps.NativeTransfer,
    message: 'Transfering XX to Bridge...'
  },
  {
    step: Steps.PromptRelayerFee,
    message: 'Prompted user to pay relayer fee...'
  },
  {
    step: Steps.WaitFee,
    message: 'Waiting for fee confirmation...'
  },
  {
    step: Steps.WaitBridge,
    message: 'Waiting for Bridge...'
  },
  {
    step: Steps.Done,
    message: 'Transfer complete!'
  }
]

const TransferXXToETH: React.FC<TransferXXToETHProps> = ({ reset }) => {
  // Hooks
  const { address } = useAccount()
  const { selectedAccount, getSigner } = useAccounts()
  const { api, ready } = useApi()
  const sent = useRef<boolean>(false)

  // State variables
  const [error, setError] = useState<string | undefined>()

  // use redux
  const tx = useAppSelector(
    (state: RootState) =>
      (selectedAccount?.address &&
        getTxFromAddress(state, selectedAccount?.address)) ||
      emptyState.tx
  )
  const fromNative = useAppSelector(
    (state: RootState) =>
      (selectedAccount?.address &&
        getFromNativeFromAddress(state, selectedAccount?.address)) ||
      emptyState.fromNative
  )
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

  // Get current relayer fee from contract
  const fetchRelayerFee = useCallback(async () => {
    try {
      const relayerFee = await readContract({
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

  /* -------------------------------------------------------------------------- */
  /*                                    Hooks                                   */
  /* -------------------------------------------------------------------------- */

  // Query proposal event every 2 seconds when waiting for bridge
  const {
    data: proposalEvent,
    loading: loadingProposalEvent,
    error: errorProposalEvent
    // networkStatus: networkStatusProposalEvent
  } = useQuery<SubProposalEvents>(SUB_PROPOSAL_EVENTS, {
    variables: {
      where: {
        _and: [
          { status: { _eq: 'Executed' } },
          { nonce: { _eq: fromNative.nonce.toString() } }
        ]
      }
    },
    pollInterval: 2000,
    skip: !fromNative.nonce || tx.status.step !== Steps.WaitBridge
  })

  // State machine
  useEffectDebugger(
    () => {
      const executeStep = async () => {
        switch (tx.status.step) {
          /* -------------------------------- Init ------------------------------- */
          case Steps.Init: {
            // check if api is ready
            if (!api || !ready) {
              goError('API not ready')
              break
            }
            // check if selected account is available
            if (!selectedAccount) {
              goError('No account selected')
              break
            }
            // Check if we have nonce and send transferNative extrinsic to bridge contract if not already sent
            if (!fromNative.nonce && !sent.current) {
              const extrinsic = api.tx.swap.transferNative(
                BigInt(tx?.amount ?? 0),
                tx?.destinationAddress ?? '',
                BRIDGE_ID_ETH_MAINNET
              )
              const signer = getSigner()
              if (signer) {
                sent.current = true
                extrinsic
                  .signAndSend(
                    selectedAccount.address,
                    { signer },
                    ({ status, events }) => {
                      if (status.isInBlock) {
                        events.forEach(({ event }) => {
                          if (
                            api.events.chainBridge.FungibleTransfer.is(event)
                          ) {
                            const [, nonceValue] = event.data
                            dispatch(
                              actions.setFromNativeNonce({
                                key: selectedAccount?.address,
                                nonce: nonceValue.toNumber()
                              })
                            )
                          }
                        })
                      }
                    }
                  )
                  .then(() => {
                    dispatch(
                      actions.incrementStepTo({
                        key: selectedAccount?.address,
                        step: State[Steps.NativeTransfer]
                      })
                    )
                  })
                  .catch(err => {
                    goError(`Error executing transferNative: ${err.message}`)
                  })
              } else {
                goError('No signer available')
              }
            } else {
              // If nonce exists, increment step because transfer was already sent
              dispatch(
                actions.incrementStepTo({
                  key: selectedAccount?.address,
                  step: State[Steps.NativeTransfer]
                })
              )
            }
            break
          }

          /* ---------------------------- NativeTransfer ---------------------------- */
          case Steps.NativeTransfer: {
            // Wait for nonce
            if (fromNative.nonce) {
              dispatch(
                actions.incrementStepTo({
                  key: selectedAccount?.address,
                  step: State[Steps.PromptRelayerFee]
                })
              )
            }
            break
          }

          /* ---------------------------- RelayerFee ---------------------------- */
          case Steps.PromptRelayerFee: {
            // if relayer fee hash exists on local storage go to wait state
            if (fromNative.txHash) {
              dispatch(
                actions.incrementStepTo({
                  key: selectedAccount?.address,
                  step: State[Steps.WaitFee]
                })
              )
              break
            }

            // Prompt user to pay relayer fee if not yet
            console.log(`Prompting user to pay relayer fee...`)
            const relayerFee = await fetchRelayerFee()
            if (relayerFee && fromNative.nonce) {
              try {
                const hash = await customWriteContract({
                  address: BRIDGE_RELAYER_FEE_ADDRESS,
                  abi: contracts.relayerFeeAbi,
                  functionName: 'payFee',
                  args: [BRIDGE_ID_XXNETWORK, BigInt(fromNative.nonce)],
                  account: address,
                  value: relayerFee
                })
                dispatch(
                  actions.setFromNativeTxHash({
                    key: selectedAccount?.address,
                    hash
                  })
                )
                dispatch(
                  actions.incrementStepTo({
                    key: selectedAccount?.address,
                    step: State[Steps.WaitFee]
                  })
                )
              } catch (err) {
                goError(`Error executing payFee: User rejected transaction`)
              }
            } else {
              goError(`Error fetching relayer fee or nonce`)
            }
            break
          }

          /* ---------------------------- WaitFee ---------------------------- */
          case Steps.WaitFee: {
            // Wait for relayer fee payment transaction to be completed / confirmed
            console.log(`Waiting for fee confirmation (3)...`, fromNative)
            if (fromNative.txHash) {
              try {
                console.log(`Waiting for fee:`, fromNative.txHash)
                const txReceipt = await waitForTransaction({
                  hash: fromNative.txHash as `0x${string}`,
                  confirmations: CONFIRMATIONS_THRESHOLD
                })
                if (txReceipt) {
                  console.log(`Fee receipt:`, txReceipt)
                  dispatch(
                    actions.incrementStepTo({
                      key: selectedAccount?.address,
                      step: State[Steps.WaitBridge]
                    })
                  )
                }
              } catch (err: any) {
                goError(`Paying relayer fee failed: ${err}`)
              }
            }
            break
          }

          /* ---------------------------- WaitBridge ---------------------------- */
          case Steps.WaitBridge: {
            // Watch executed event on Bridge smart contract (updated by memoized nonce)
            // TODO: add domain specific event filter
            if (!errorProposalEvent && !loadingProposalEvent && proposalEvent) {
              if (proposalEvent.proposal.length > 0) {
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
            console.log(`Unknown step: ${tx.status.step}`)
            break
        }
      }
      if (api && ready && selectedAccount && tx && fromNative) {
        executeStep()
      }
    },
    [
      api,
      ready,
      selectedAccount,
      tx,
      fromNative,
      fetchRelayerFee,
      errorProposalEvent,
      loadingProposalEvent,
      proposalEvent
    ],
    [
      'api',
      'ready',
      'selectedAccount',
      'tx',
      'fromNative',
      'fetchRelayerFee',
      'errorProposalEvent',
      'loadingProposalEvent',
      'proposalEvent'
    ]
  )

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
              // TODO: cannot reset tx details and save nonce because nonce is linked to the transaction. Reset the whole state after a native transfer will make user lose ability to pay the relayer fee to unlock that transaction. Need to find a way to save nonce and txHash for each transaction or simply do not let user reset the state until transaction is completed.
              if (!fromNative.nonce) {
                sent.current = false
              }
              setError(undefined)
              dispatch(
                actions.incrementStepTo({
                  key: selectedAccount?.address,
                  step: { step: 0, message: '' }
                })
              )
            }}
          >
            Retry
          </StyledButton>
        </Stack>
      ) : (
        <>
          <Stack direction="column" padding={2} spacing="20px">
            <CustomStepper
              steps={State.filter(state => state.step !== Steps.Idle)}
              activeStep={tx.status.step}
            />
            <Stack
              direction="column"
              spacing="20px"
              padding={2}
              alignItems="left"
            >
              {tx.status.step < Steps.Done ? (
                <Typography variant="body1" fontWeight="bold">
                  {tx.status.step + 1}. {tx.status.message}
                </Typography>
              ) : (
                <Stack
                  sx={{
                    flexDirection: 'column'
                  }}
                  alignItems="center"
                  spacing="20px"
                >
                  <Typography variant="h5">Transfer complete!</Typography>
                  <Link
                    variant="body2"
                    href={`${ETH_EXPLORER_URL}/tx/${fromNative.txHash}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View transaction in Etherscan
                  </Link>
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
          {tx.status.step < Steps.Done && (
            <Stack
              flexDirection="row"
              alignItems="center"
              justifyContent="right"
              padding={2}
              gap="5px"
            >
              <StyledButton
                small
                onClick={() => {
                  dispatch(actions.resetKey(selectedAccount?.address))
                  resetState()
                }}
              >
                Reset
              </StyledButton>
              <CustomTooltip title="Resetting now will cancel the current transaction. You'll lose the chance to pay the relayer fee and complete the initial transfer. If unclaimed, the xx tokens waiting on the bridge will be returned to the original address after 5 minutes.">
                <Info fontSize="small" />
              </CustomTooltip>
            </Stack>
          )}
        </>
      )}
    </>
  )
}

export default TransferXXToETH
