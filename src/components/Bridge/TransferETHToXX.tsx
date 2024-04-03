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
  Done = 4
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
  const [depositTxHash, setDepositTxHash] = useLocalStorage<string>(
    `depositTxHash-${address}`,
    ''
  )
  const [blockNumber, setBlockNumber] = useState<string>()

  // Reset state + call prop
  const resetAll = useCallback(() => {
    setStep(Step.Init)
    reset()
  }, [reset])

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
              setBlockNumber(bridgeEvent.event[0].blockNumber)
              setStep(Step.Done)
            }
          }
          if (errorDepositNonce) {
            console.log(`Error getting deposit nonce: ${errorDepositNonce}`)
            setError(`Error getting deposit nonce: ${errorDepositNonce}`)
            resetAll()
          }
          if (errorBridgeEvent) {
            console.log(`Error getting bridge event: ${errorBridgeEvent}`)
            setError(`Error getting bridge event: ${errorBridgeEvent}`)
            resetAll()
          }
          break
        }

        /* ---------------------------- Done ---------------------------- */
        case Step.Done: {
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
      {approve && step === Step.ApproveSpend && (
        <Approve error={resetAll} done={() => setStep(Step.BridgeDeposit)} />
      )}
      {step === Step.BridgeDeposit && (
        <Deposit
          recipient={recipient}
          amount={amount}
          error={resetAll}
          setDepositTxHash={setDepositTxHash}
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
            href={`${XX_EXPLORER_URL}/blocks/${blockNumber}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            View block in xx Explorer
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
              resetAll()
            }}
          >
            Back to the Bridge
          </StyledButton>
        </Stack>
      )}
      {step !== Step.Done && step !== Step.ApproveSpend && (
        <Loading size="sm2" />
      )}
      {error && <Typography color="error">{error}</Typography>}
    </Stack>
  )
}

export default TransferETHToXX
