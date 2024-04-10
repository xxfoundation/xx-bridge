import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction
} from 'wagmi'
import { useSubscription } from '@apollo/client'
import Loading from '../../../Utils/Loading'
import useApi from '@/plugins/substrate/hooks/useApi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import {
  BRIDGE_ID_ETH_MAINNET,
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RELAYER_FEE_ADDRESS,
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

interface TransferXXToETHProps {
  reset: () => void
}

// From XX to ETH: Native Transfer (xx) -> Pay Fee (eth) -> Wait for Bridge -> Done
export enum Steps {
  Init = 0,
  NativeTransfer = 1,
  RelayerFee = 2,
  WaitFee = 3,
  WaitBridge = 4,
  Done = 5
}

export const State: CustomStep[] = [
  {
    step: Steps.Init,
    message: 'Initializing transfer'
  },
  {
    step: Steps.NativeTransfer,
    message: 'Transfering XX to Bridge'
  },
  {
    step: Steps.RelayerFee,
    message: 'Paying Bridge Relayer Fee'
  },
  {
    step: Steps.WaitFee,
    message: 'Waiting for Fee Confirmation'
  },
  {
    step: Steps.WaitBridge,
    message: 'Waiting for Bridge'
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

  // const goError = useCallback((msg: string) => {
  //   dispatch(actions.resetKey(address))
  //   setError(msg)
  // }, [])

  // Reset state + call prop
  const resetState = useCallback(() => {
    dispatch(actions.resetKey(address))
    setError(undefined)
    reset()
  }, [reset])

  // Transfer native extrinsic
  const sent = useRef<boolean>(false)
  useEffect(() => {
    if (
      api &&
      ready &&
      selectedAccount &&
      fromNative?.status.step === Steps.Init &&
      !sent.current
    ) {
      const extrinsic = api.tx.swap.transferNative(
        BigInt(tx?.amount ?? 0),
        tx?.destinationAddress ?? '',
        BRIDGE_ID_ETH_MAINNET
      )
      const signer = getSigner()
      if (signer) {
        sent.current = true
        dispatch(
          actions.setFromNativeStatus({
            key: address,
            status: State[Steps.NativeTransfer]
          })
        )
        extrinsic
          .signAndSend(
            selectedAccount.address,
            { signer },
            ({ status, events }) => {
              if (status.isInBlock) {
                events.forEach(({ event }) => {
                  if (api.events.chainBridge.FungibleTransfer.is(event)) {
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
            console.error(`Error executing transferNative: ${err.message}`)
            setError(`Error executing transferNative: ${err.message}`)
            resetState()
          })
      } else {
        console.error('No signer available')
        setError('No signer available')
        resetState()
      }
    }
  }, [
    api,
    ready,
    selectedAccount,
    fromNative,
    tx,
    address,
    getSigner,
    dispatch,
    resetState
  ])

  /* -------------------------------------------------------------------------- */
  /*                                    Hooks                                   */
  /* -------------------------------------------------------------------------- */
  // Get current relayer fee from contract
  const {
    data: relayerFee,
    isError: relayerFeeError,
    isLoading: relayerFeeLoading
  } = useContractRead({
    address: BRIDGE_RELAYER_FEE_ADDRESS,
    abi: contracts.relayerFeeAbi,
    functionName: 'currentFee'
  })

  const givenNonce = useMemo(() => fromNative.nonce ?? 0, [fromNative.nonce])

  // Relayer fee payment transaction
  const { config: configPayFee, error: errorPayFee } = usePrepareContractWrite({
    address: BRIDGE_RELAYER_FEE_ADDRESS,
    abi: contracts.relayerFeeAbi,
    functionName: 'payFee',
    args: [BRIDGE_ID_XXNETWORK, BigInt(givenNonce)],
    account: address,
    value: relayerFee || BigInt(0)
  })
  const {
    data: payFeeData,
    write: callPayFee,
    isError: payFeeError,
    isLoading: payFeeLoading
  } = useContractWrite(configPayFee)

  // Wait for transaction
  const { data: txReceipt, error: errorTxReceipt } = useWaitForTransaction({
    hash: (fromNative.txHash ?? '0x') as `0x${string}`,
    confirmations: 3
  })

  // Watch executed event on Bridge smart contract
  const { data: proposalEvent, error: errorProposalEvent } =
    useSubscription<SubProposalEvents>(SUB_PROPOSAL_EVENTS, {
      variables: {
        where: {
          _and: [
            { status: { _eq: 'Executed' } },
            { nonce: { _eq: fromNative.nonce?.toString() ?? '' } }
          ]
        }
      }
    })
  /* ------------------------------------ - ----------------------------------- */

  // State machine
  useEffectDebugger(
    () => {
      const executeStep = async () => {
        switch (fromNative.status.step) {
          /* -------------------------------- Init ------------------------------- */
          case Steps.Init: {
            // Wait for signer
            break
          }

          /* ---------------------------- NativeTransfer ---------------------------- */
          case Steps.NativeTransfer: {
            // Wait for nonce
            if (givenNonce) {
              dispatch(
                actions.setFromNativeStatus({
                  key: address,
                  status: State[Steps.RelayerFee]
                })
              )
            }
            break
          }

          /* ---------------------------- RelayerFee ---------------------------- */
          case Steps.RelayerFee: {
            if (relayerFeeError) {
              setError(`Error getting relayer fee: ${relayerFeeError}`)
            }
            if (errorPayFee) {
              setError(`Error executing payFee: ${errorPayFee}`)
            }
            if (!relayerFeeLoading && callPayFee) {
              callPayFee()
              dispatch(
                actions.setFromNativeStatus({
                  key: address,
                  status: State[Steps.WaitFee]
                })
              )
            }
            break
          }

          /* ---------------------------- WaitFee ---------------------------- */
          case Steps.WaitFee: {
            if (!payFeeLoading) {
              if (payFeeError) {
                setError(`Error paying relayer fee: User rejected transaction`)
                return
              }
              if (payFeeData) {
                dispatch(
                  actions.setFromNativeTxHash({
                    key: address,
                    hash: payFeeData.hash
                  })
                )
              }
              if (errorTxReceipt) {
                setError(`Paying relayer fee failed: ${errorTxReceipt}`)
              }
              if (txReceipt) {
                console.log(`Relayer fee paid!`)
                dispatch(
                  actions.setFromNativeStatus({
                    key: address,
                    status: State[Steps.WaitBridge]
                  })
                )
              }
            }
            break
          }

          /* ---------------------------- WaitBridge ---------------------------- */
          case Steps.WaitBridge: {
            if (!errorProposalEvent && proposalEvent) {
              if (proposalEvent.proposal.length > 0) {
                dispatch(
                  actions.setFromNativeTxHash({
                    key: address,
                    hash: txReceipt?.transactionHash ?? ''
                  })
                )
                dispatch(
                  actions.setFromNativeStatus({
                    key: address,
                    status: State[Steps.Done]
                  })
                )
              }
            }
            break
          }

          /* ---------------------------- Done ---------------------------- */
          case Steps.Done: {
            // Noop
            break
          }

          /* -------------------------------------------------------------------------- */
          default:
            throw new Error(`Unknown step: ${fromNative.status.step}`)
        }
      }
      if (api && selectedAccount && fromNative && relayerFee !== undefined) {
        executeStep()
      }
    },
    [
      api,
      selectedAccount,
      fromNative,
      relayerFee,
      relayerFeeError,
      relayerFeeLoading,
      errorPayFee,
      payFeeError,
      payFeeLoading,
      callPayFee,
      txReceipt,
      errorTxReceipt,
      proposalEvent,
      errorProposalEvent,
      resetState
    ],
    [
      'api',
      'selectedAccount',
      'fromNative',
      'relayerFee',
      'relayerFeeError',
      'relayerFeeLoading',
      'errorPayFee',
      'payFeeError',
      'payFeeLoading',
      'callPayFee',
      'txReceipt',
      'errorTxReceipt',
      'proposalEvent',
      'errorProposalEvent',
      'resetState'
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
            <CustomStepper steps={State} activeStep={fromNative.status.step} />
            <Stack
              direction="column"
              spacing="20px"
              padding={2}
              alignItems="left"
            >
              {fromNative.status.step === Steps.NativeTransfer && (
                <Typography>Transfering native XX to Bridge ...</Typography>
              )}
              {(fromNative.status.step === Steps.RelayerFee ||
                fromNative.status.step === Steps.WaitFee) && (
                <Typography>Paying Bridge Fee...</Typography>
              )}
              {fromNative.status.step === Steps.WaitBridge && (
                <Typography>
                  Waiting for Bridge... This can take up to 2 min. Please be
                  patient.
                </Typography>
              )}
              {fromNative.status.step >= Steps.Done && (
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
                    Back to the Bridge
                  </StyledButton>
                </Stack>
              )}
              {fromNative.status.step !== Steps.Done && <Loading size="sm2" />}
            </Stack>
          </Stack>
          <Stack justifyContent="right" padding={2}>
            <StyledButton
              small
              onClick={() => {
                resetState()
              }}
            >
              Reset
            </StyledButton>
          </Stack>
        </>
      )}
    </>
  )
}

export default TransferXXToETH
