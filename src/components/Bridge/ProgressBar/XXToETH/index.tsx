import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import { useAppSelector } from '@/plugins/redux/hooks'
import { getTxFromAddress } from '@/plugins/redux/selectors'
import { RootState } from '@/plugins/redux/types'

interface TransferXXToETHProps {
  reset: () => void
}

// From XX to ETH: Native Transfer (xx) -> Pay Fee (eth) -> Wait for Bridge -> Done
export enum Steps {
  Error = -1,
  Init = 0,
  NativeTransfer = 1,
  RelayerFee = 2,
  WaitFee = 3,
  WaitBridge = 4,
  Done = 5
}

const TransferXXToETH: React.FC<TransferXXToETHProps> = ({ reset }) => {
  // Hooks
  const { address } = useAccount()
  const { selectedAccount, getSigner } = useAccounts()
  const { api, ready } = useApi()

  const [step, setStep] = useState<number>(Steps.Init)
  const [nonce, setNonce] = useState<bigint>()
  const [error, setError] = useState<string | undefined>()
  const [txHash, setTxHash] = useState<string>()

  // use redux
  const tx = useAppSelector(
    (state: RootState) => address && getTxFromAddress(state, address)
  )

  // Reset state + call prop
  const resetAll = useCallback(() => {
    setStep(Steps.Init)
    reset()
  }, [reset])

  // Transfer native extrinsic
  const sent = useRef<boolean>(false)
  useEffect(() => {
    if (
      api &&
      ready &&
      selectedAccount &&
      step === Steps.Init &&
      !sent.current
    ) {
      const extrinsic = api.tx.swap.transferNative(
        BigInt(tx?.amount ?? 0),
        tx?.destinationddress ?? '',
        BRIDGE_ID_ETH_MAINNET
      )
      const signer = getSigner()
      if (signer) {
        sent.current = true
        setStep(Steps.NativeTransfer)
        extrinsic
          .signAndSend(
            selectedAccount.address,
            { signer },
            ({ status, events }) => {
              if (status.isInBlock) {
                events.forEach(({ event }) => {
                  if (api.events.chainBridge.FungibleTransfer.is(event)) {
                    const [, nonceValue] = event.data
                    setNonce(nonceValue.toBigInt())
                  }
                })
              }
            }
          )
          .catch(err => {
            console.error(`Error executing transferNative: ${err.message}`)
            setError(`Error executing transferNative: ${err.message}`)
            resetAll()
          })
      } else {
        console.error('No signer available')
        setError('No signer available')
        resetAll()
      }
    }
  }, [api, ready, step, sent, selectedAccount, setError, getSigner])

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

  // Relayer fee payment transaction
  const { config: configPayFee, error: errorPayFee } = usePrepareContractWrite({
    address: BRIDGE_RELAYER_FEE_ADDRESS,
    abi: contracts.relayerFeeAbi,
    functionName: 'payFee',
    args: [BRIDGE_ID_XXNETWORK, nonce || BigInt(0)],
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
    hash: payFeeData?.hash,
    confirmations: 3
  })

  // Watch executed event on Bridge smart contract
  const { data: proposalEvent, error: errorProposalEvent } =
    useSubscription<SubProposalEvents>(SUB_PROPOSAL_EVENTS, {
      variables: {
        where: {
          _and: [
            { status: { _eq: 'Executed' } },
            { nonce: { _eq: nonce?.toString() ?? '' } }
          ]
        }
      }
    })
  /* ------------------------------------ - ----------------------------------- */

  // State machine
  useEffect(() => {
    const executeStep = async () => {
      switch (step) {
        /* -------------------------------- Init ------------------------------- */
        case Steps.Init: {
          // Wait for signer
          break
        }

        /* ---------------------------- NativeTransfer ---------------------------- */
        case Steps.NativeTransfer: {
          // Wait for nonce
          if (nonce !== undefined) {
            setStep(Steps.RelayerFee)
          }
          break
        }

        /* ---------------------------- RelayerFee ---------------------------- */
        case Steps.RelayerFee: {
          if (relayerFeeError) {
            setError(`Error getting relayer fee: ${relayerFeeError}`)
            resetAll()
          }
          if (errorPayFee) {
            setError(`Error executing payFee: ${errorPayFee}`)
            resetAll()
          }
          if (!relayerFeeLoading && callPayFee) {
            callPayFee()
            setStep(Steps.WaitFee)
          }
          break
        }

        /* ---------------------------- WaitFee ---------------------------- */
        case Steps.WaitFee: {
          if (!payFeeError && !payFeeLoading && txReceipt) {
            if (errorTxReceipt) {
              setError(`Paying relayer fee failed: ${errorTxReceipt}`)
              resetAll()
            }
            console.log(`Relayer fee paid!`)
            setStep(Steps.WaitBridge)
          }
          break
        }

        /* ---------------------------- WaitBridge ---------------------------- */
        case Steps.WaitBridge: {
          if (!errorProposalEvent && proposalEvent) {
            if (proposalEvent.proposal.length > 0) {
              setTxHash(txReceipt?.transactionHash ?? '')
              setStep(Steps.Done)
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
          throw new Error(`Unknown step: ${step}`)
      }
    }
    if (api && selectedAccount && relayerFee !== undefined) {
      executeStep()
    }
  }, [
    api,
    selectedAccount,
    step,
    nonce,
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
    resetAll
  ])

  return (
    <Stack
      direction="column"
      padding={2}
      justifyContent="center"
      alignItems="center"
      spacing="20px"
    >
      {step === Steps.NativeTransfer && (
        <Typography>Transfering native XX to Bridge ...</Typography>
      )}
      {(step === Steps.RelayerFee || step === Steps.WaitFee) && (
        <Typography>Paying Bridge Fee...</Typography>
      )}
      {step === Steps.WaitBridge && (
        <Typography>
          Waiting for Bridge... This can take up to 2 min. Please be patient.
        </Typography>
      )}
      {step === Steps.Done && (
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
            href={`${ETH_EXPLORER_URL}/tx/${txHash}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            View transaction in Etherscan
          </Link>
          <StyledButton
            onClick={() => {
              resetAll()
            }}
          >
            Back to the Bridge
          </StyledButton>
        </Stack>
      )}
      {step !== Steps.Done && <Loading size="sm2" />}
      {error && <Typography color="error">{error}</Typography>}
    </Stack>
  )
}

export default TransferXXToETH
