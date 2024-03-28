import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction
} from 'wagmi'
import { useSubscription } from '@apollo/client'
import Loading from '../Utils/Loading'
import useApi from '@/plugins/substrate/hooks/useApi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import {
  BRIDGE_ID_ETH_MAINNET,
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RELAYER_FEE_ADDRESS
} from '@/consts'
import contracts from '@/contracts'
import {
  SUB_PROPOSAL_EVENTS,
  SubProposalEvents
} from '@/plugins/apollo/schemas'

interface TransferXXToETHProps {
  recipient: string
  amount: bigint
  reset: () => void
}

// Steps
enum Step {
  Init = 0,
  TransferNative = 1,
  RelayerFee = 2,
  WaitFee = 3,
  WaitBridge = 4,
  Done = 5
}

const TransferXXToETH: React.FC<TransferXXToETHProps> = ({
  recipient,
  amount,
  reset
}) => {
  // Hooks
  const { address } = useAccount()
  const { selectedAccount, getSigner } = useAccounts()
  const { api } = useApi()

  const [step, setStep] = useState<Step>(Step.Init)
  const [nonce, setNonce] = useState<bigint>()

  // TODO: improve error handling + flow?

  // Reset state + call prop
  const resetAll = useCallback(() => {
    setStep(Step.Init)
    reset()
  }, [reset])

  // Transfer native extrinsic
  const sent = useRef(false)
  useEffect(() => {
    if (api && selectedAccount && step === Step.Init && !sent.current) {
      const extrinsic = api.tx.swap.transferNative(
        amount,
        recipient,
        BRIDGE_ID_ETH_MAINNET
      )
      const signer = getSigner()
      if (signer) {
        sent.current = true
        setStep(Step.TransferNative)
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
            console.error('Error executing transferNative', err)
            resetAll()
          })
      }
    }
  }, [api, step, sent, selectedAccount, recipient, amount, getSigner])

  // Get current relayer fee from contract
  const {
    data: relayerFee,
    isError: relayerFeeError
    // isLoading: relayerFeeLoading, // TODO: use this?
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
    write: callPayFee
    // isLoading: payFeeLoading // TODO: use this?
  } = useContractWrite(configPayFee)

  // Wait for transaction
  const { data: txReceipt, error: errorTxReceipt } = useWaitForTransaction({
    hash: payFeeData?.hash,
    confirmations: 5
  })

  // Watch executed event on Bridge smart contract
  const {
    data: proposalEvent,
    loading: loadingProposalEvent,
    error: errorProposalEvent
  } = useSubscription<SubProposalEvents>(SUB_PROPOSAL_EVENTS, {
    variables: {
      where: {
        _and: [{ status: { _eq: 'Executed' } }, { nonce: { _eq: '1' } }]
      }
    }
  })

  useEffect(() => {
    console.log(`ProposalEvent: ${JSON.stringify(proposalEvent)}`)
    if (proposalEvent && !loadingProposalEvent && !errorProposalEvent) {
      console.log('ProposalEvent received!')
      setStep(Step.Done)
    }
  }, [proposalEvent])

  // State machine
  useEffect(() => {
    const executeStep = async () => {
      switch (step) {
        /* -------------------------------- Init ------------------------------- */
        case Step.Init: {
          // Send extrinsic
          break
        }

        /* ---------------------------- TransferNative ---------------------------- */
        case Step.TransferNative: {
          // Wait for nonce
          if (nonce !== undefined) {
            setStep(Step.RelayerFee)
          }
          break
        }

        /* ---------------------------- RelayerFee ---------------------------- */
        case Step.RelayerFee: {
          if (relayerFeeError) {
            console.error('Error getting relayer fee', relayerFeeError)
            resetAll()
          }
          if (errorPayFee) {
            console.error('Error executing payFee', errorPayFee)
            resetAll()
          }
          if (callPayFee) {
            console.log(`Paying relayer fee`)
            callPayFee()
            setStep(Step.WaitFee)
          }
          break
        }

        /* ---------------------------- WaitFee ---------------------------- */
        case Step.WaitFee: {
          if (txReceipt) {
            if (errorTxReceipt) {
              console.log(`Paying relayer fee failed!`)
              resetAll()
            }
            console.log(`Relayer fee paid!`)
            setStep(Step.WaitBridge)
          }
          break
        }

        /* ---------------------------- WaitBridge ---------------------------- */
        case Step.WaitBridge: {
          // TODO: see comments above
          setTimeout(() => {
            setStep(Step.Done)
          }, 10000)
          break
        }

        /* ---------------------------- Done ---------------------------- */
        case Step.Done: {
          setTimeout(() => {
            resetAll()
          }, 3000)
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          throw new Error(`Unknown step: ${step}`)
      }
    }
    if (
      api &&
      selectedAccount &&
      recipient !== '' &&
      amount !== undefined &&
      relayerFee !== undefined
    ) {
      executeStep()
    }
  }, [
    api,
    selectedAccount,
    step,
    nonce,
    relayerFee,
    relayerFeeError,
    errorPayFee,
    callPayFee,
    txReceipt,
    errorTxReceipt,
    recipient,
    amount,
    resetAll
  ])

  // TODO: improve UI
  return (
    <Stack direction="column" padding={2} justifyContent="center">
      {step === Step.TransferNative && (
        <Typography>Transfering native XX to Bridge ...</Typography>
      )}
      {(step === Step.RelayerFee || step === Step.WaitFee) && (
        <Typography>Paying Bridge Fee ...</Typography>
      )}
      {step === Step.WaitBridge && (
        <Stack direction="column" padding={2} alignItems="center">
          <Typography>Waiting for Bridge ...</Typography>
          <Loading size="sm2" />
        </Stack>
      )}
      {step === Step.Done && (
        <Typography variant="h5">Transfer complete!</Typography>
      )}
    </Stack>
  )
}

export default TransferXXToETH
