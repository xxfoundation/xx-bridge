import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useSendTransaction, useWaitForTransaction } from 'wagmi'
import Loading from '../Utils/Loading'
import useApi from '@/plugins/substrate/hooks/useApi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import { BRIDGE_ID_ETH_MAINNET, RELAYER_ADDRESS, RELAYER_FEE } from '@/consts'
import { encodeNonce } from '@/utils'

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

  // Encoded nonce
  const encodedNonce = useMemo(
    () => (nonce !== undefined ? encodeNonce(nonce) : '0x'),
    [nonce]
  )

  // Relayer fee transaction
  const {
    data: dataTx,
    sendTransaction,
    error: errorTx
  } = useSendTransaction({
    account: address,
    to: RELAYER_ADDRESS,
    value: BigInt(RELAYER_FEE * 10 ** 18),
    data: encodedNonce
  })

  // Wait for transaction
  const { data: txReceipt, error: errorTxReceipt } = useWaitForTransaction({
    hash: dataTx?.hash,
    confirmations: 5
  })

  // Watch executed event on Bridge smart contract
  // TODO: test if this is not working properly only with local GETH instance
  // TODO: find a more reliable way to do this (custom squid indexer?)
  // useContractEvent({
  //   address: BRIDGE_ADDRESS,
  //   abi: bridgeAbi,
  //   eventName: 'ProposalEvent',
  //   listener: (data) => {
  //     console.log(`ProposalEvent: ${JSON.stringify(data)}`)
  //     setStep(Step.Done)
  //   }
  // })

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
          console.log(`Paying relayer fee`)
          sendTransaction()
          setStep(Step.WaitFee)
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
    if (api && selectedAccount && recipient !== '' && amount !== undefined) {
      executeStep()
    }
  }, [
    api,
    selectedAccount,
    step,
    nonce,
    errorTx,
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
