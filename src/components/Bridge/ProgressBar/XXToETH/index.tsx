import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { readContract, waitForTransaction } from 'wagmi/actions'
import { useQuery } from '@apollo/client'
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

interface TransferXXToETHProps {
  reset: () => void
}

// From XX to ETH: Native Transfer (xx) -> Pay Fee (eth) -> Wait for Bridge -> Done
export enum Steps {
  Init = 0,
  NativeTransfer = 1,
  PromptRelayerFee = 2,
  WaitFee = 3,
  WaitBridge = 4,
  Done = 5
}

export const State: CustomStep[] = [
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
  const transactions = useAppSelector((state: RootState) => state.transactions)
  const tx = useAppSelector(
    (state: RootState) =>
      (address && getTxFromAddress(state, address)) || emptyState.tx
  )
  const fromNative = useAppSelector(
    (state: RootState) =>
      (address && getFromNativeFromAddress(state, address)) ||
      emptyState.fromNative
  )
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
            console.log(`Initializing transfer...`, fromNative)
            if (!fromNative.nonce && !sent.current) {
              const extrinsic = api.tx.swap.transferNative(
                BigInt(tx?.amount ?? 0),
                tx?.destinationAddress ?? '',
                BRIDGE_ID_ETH_MAINNET
              )
              const signer = getSigner()
              if (signer) {
                console.log(
                  `Sending transferNative extrinsic... with signer`,
                  sent.current
                )
                sent.current = true
                dispatch(
                  actions.incrementStepTo({
                    key: address,
                    step: State[Steps.NativeTransfer]
                  })
                )
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
                                key: address,
                                nonce: nonceValue.toNumber()
                              })
                            )
                          }
                        })
                      }
                    }
                  )
                  .catch(err => {
                    goError(`Error executing transferNative: ${err.message}`)
                    resetState()
                  })
              } else {
                goError('No signer available')
                resetState()
              }
            } else {
              // If nonce exists, increment step because transfer was already sent
              dispatch(
                actions.incrementStepTo({
                  key: address,
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
                  key: address,
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
                  key: address,
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
                    key: address,
                    hash
                  })
                )
                dispatch(
                  actions.incrementStepTo({
                    key: address,
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
                      key: address,
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
                    key: address,
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
              resetState()
            }}
          >
            Go Back
          </StyledButton>
        </Stack>
      ) : (
        <>
          <Stack direction="column" padding={2} spacing="20px">
            <CustomStepper steps={State} activeStep={tx.status.step} />
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

export default TransferXXToETH
