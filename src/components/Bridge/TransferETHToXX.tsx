import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSubscription } from '@apollo/client'
import { useAccount } from 'wagmi'
import Loading from '../Utils/Loading'
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
import StyledButton from '../custom/StyledButton'
import useLocalStorage from '@/hooks/useLocalStorage'

interface TransferETHToXXProps {
  approve: boolean
  recipient: string
  amount: bigint
  reset: () => void
}

// Steps
enum Step {
  Init = 0,
  ApproveSpend = 1,
  BridgeDeposit = 2,
  WaitBridge = 3,
  Done = 4,
  Error = 5
}

const TransferETHToXX: React.FC<TransferETHToXXProps> = ({
  approve,
  recipient,
  amount,
  reset
}) => {
  const { address } = useAccount()
  const [step, setStep] = useState<Step>(Step.Init)
  const [error, setError] = useState<string | undefined>()
  const [, setLocalStorageDepositTxHash] = useLocalStorage<string>(
    `depositTxHash-${address}`,
    ''
  )
  const [depositTxHash, setDepositTxHash] = useState<string>()
  const [extrinsic, setExtrinsic] = useState<string>()

  // Set deposit tx hash state and local storage
  const setDepositTxHashAll = useCallback((hash: string) => {
    setDepositTxHash(hash)
    setLocalStorageDepositTxHash(hash)
  }, [])

  // State and error handling

  // Go to error state
  const goError = useCallback((msg: string) => {
    setError(msg)
    setStep(Step.Error)
  }, [])

  // Reset state and go back to home page
  const resetState = useCallback(() => {
    setStep(Step.Init)
    setError(undefined)
    setDepositTxHash(undefined)
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
    console.log('depositTxHash', depositTxHash)
    return depositTxHash || ''
  }, [depositTxHash])

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
  useEffect(() => {
    const executeStep = async () => {
      switch (step) {
        /* -------------------------------- Init ------------------------------- */
        case Step.Init: {
          // Go to approve if needed, otherwise go to deposit
          if (approve) {
            setStep(Step.ApproveSpend)
          } else {
            setStep(Step.BridgeDeposit)
          }
          break
        }

        /* ---------------------------- ApproveSpend ---------------------------- */
        case Step.ApproveSpend: {
          // Noop
          break
        }

        /* ---------------------------- BridgeDeposit ---------------------------- */
        case Step.BridgeDeposit: {
          // Noop
          break
        }

        /* ---------------------------- WaitBridge ---------------------------- */
        case Step.WaitBridge: {
          if (!errorDepositNonce && !errorBridgeEvent && bridgeEvent) {
            if (bridgeEvent.event.length > 0) {
              const block = bridgeEvent.event[0].blockNumber
              const extrinsicIdx = JSON.parse(bridgeEvent.event[0].phase)
                .applyExtrinsic as number
              setExtrinsic(`${block}-${extrinsicIdx}`)
              setStep(Step.Done)
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
        case Step.Done: {
          // Noop
          break
        }

        /* ---------------------------- Error ---------------------------- */
        case Step.Error: {
          // Noop
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          throw new Error(`Unknown step: ${step}`)
      }
    }
    if (recipient !== '' && amount !== undefined) {
      executeStep()
    }
  }, [
    step,
    recipient,
    amount,
    approve,
    errorDepositNonce,
    errorBridgeEvent,
    bridgeEvent,
    goError,
    reset
  ])

  return (
    <Stack
      direction="column"
      padding={2}
      justifyContent="center"
      alignItems="center"
      spacing="20px"
    >
      {approve && step === Step.ApproveSpend && (
        <Approve
          setError={handleError}
          done={() => setStep(Step.BridgeDeposit)}
        />
      )}
      {step === Step.BridgeDeposit && (
        <Deposit
          recipient={recipient}
          amount={amount}
          setError={handleError}
          setDepositTxHash={setDepositTxHashAll}
          done={() => setStep(Step.WaitBridge)}
        />
      )}
      {step === Step.WaitBridge && (
        <Typography>Waiting for Bridge ...</Typography>
      )}
      {step === Step.Done && (
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
      {step !== Step.Done &&
        step !== Step.ApproveSpend &&
        step !== Step.Error && <Loading size="sm2" />}
      {step === Step.Error && (
        <Stack
          direction="column"
          spacing="20px"
          padding={2}
          alignItems="center"
        >
          <Typography color="error" variant="h5" fontWeight="bold">
            Something went wrong
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
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
  )
}

export default TransferETHToXX
