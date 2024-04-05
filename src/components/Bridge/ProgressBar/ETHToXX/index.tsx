import { Link, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSubscription } from '@apollo/client'
import { useAccount } from 'wagmi'
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
import StyledButton from '../../../custom/StyledButton'
import useLocalStorage from '@/hooks/useLocalStorage'
import CustomStepper, { CustomStep } from '../Stepper'
import { Transaction, updateTransaction } from '../Status'

interface TransferETHToXXProps {
  approve: boolean
  recipient: string
  amount: bigint
  reset: () => void
}

export enum Steps {
  Error = -1,
  Init = 0,
  ApproveSpend = 1,
  BridgeDeposit = 2,
  WaitBridge = 3,
  Done = 4,
  Complete = 5
}

const State: CustomStep[] = [
  {
    step: Steps.Init,
    message: 'Initializing transfer'
  },
  {
    step: Steps.ApproveSpend,
    message: 'Approving spending'
  },
  {
    step: Steps.BridgeDeposit,
    message: 'Depositing to bridge'
  },
  {
    step: Steps.WaitBridge,
    message: 'Waiting for bridge'
  },
  {
    step: Steps.Done,
    message: 'Transfer complete'
  }
]

const TransferETHToXX: React.FC<TransferETHToXXProps> = ({
  approve,
  recipient,
  amount,
  reset
}) => {
  const { address } = useAccount()
  const [step, setStep] = useState<number>(Steps.Init)
  const [error, setError] = useState<string | undefined>()
  const [extrinsic, setExtrinsic] = useState<string>()

  // Local Storage
  const [transaction, setTransaction] = useLocalStorage<Transaction>(
    `tx-${address}`
  )

  // Synchronously updates 'transaction' from localStorage to immediately reflect external changes. This approach compensates for the useLocalStorage hook's delay in syncing with localStorage, ensuring 'transaction' is always current without waiting for the next re-render.
  useEffect(() => {
    const value = localStorage.getItem(`tx-${address}`)
    if (value) {
      const tx = JSON.parse(value) as Transaction
      setTransaction(tx)
    }
  }, [address])

  // Go to error state
  const goError = useCallback((msg: string) => {
    setStep(-1)
    setError(msg)
  }, [])

  // Reset state and go back to home page
  const resetState = useCallback(() => {
    setStep(Steps.Init)
    setError(undefined)
    setExtrinsic(undefined)
    localStorage.removeItem(`tx-${address}`)
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
    console.log('depositTxHash', transaction?.fromEth?.depositTxHash)
    return transaction?.fromEth?.depositTxHash || ''
  }, [transaction])

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
        case Steps.Init: {
          // Check if on going transaction is already saved on local storage
          if (
            transaction &&
            transaction.sourceId === 1 &&
            transaction.status !== Steps.Init
          ) {
            setStep(transaction.status)
            break
          }

          // Go to approve if needed, otherwise go to deposit
          if (approve) {
            setStep(Steps.ApproveSpend)
            updateTransaction(setTransaction, ['status'], Steps.ApproveSpend)
          } else {
            console.log('No need to approve')
            setStep(Steps.BridgeDeposit)
            updateTransaction(setTransaction, ['status'], Steps.BridgeDeposit)
          }
          break
        }

        /* ---------------------------- ApproveSpend ---------------------------- */
        case Steps.ApproveSpend: {
          // Wait for Approval to finish
          break
        }

        /* ---------------------------- BridgeDeposit ---------------------------- */
        case Steps.BridgeDeposit: {
          // Update transaction state on local storage
          if (transaction?.status !== Steps.BridgeDeposit) {
            updateTransaction(setTransaction, ['status'], Steps.BridgeDeposit)
            updateTransaction(setTransaction, ['needApprove'], false)
          }
          // Wait for Bridge deposit to finish
          break
        }

        /* ---------------------------- WaitBridge ---------------------------- */
        case Steps.WaitBridge: {
          console.log('Waiting for bridge event...')
          // Update transaction state on local storage
          if (transaction?.status !== Steps.WaitBridge) {
            updateTransaction(setTransaction, ['status'], Steps.WaitBridge)
          }
          // Check if bridge event is emitted
          if (!errorDepositNonce && !errorBridgeEvent && bridgeEvent) {
            if (bridgeEvent.event.length > 0) {
              const block = bridgeEvent.event[0].blockNumber
              const extrinsicIdx = JSON.parse(bridgeEvent.event[0].phase)
                .applyExtrinsic as number
              setExtrinsic(`${block}-${extrinsicIdx}`)
              setStep(Steps.Done)
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
        case Steps.Done: {
          // Update transaction state on local storage
          if (transaction?.status !== Steps.Done) {
            updateTransaction(setTransaction, ['status'], Steps.Done)
          }
          setTimeout(() => {
            setStep(Steps.Done + 1)
          }, 2000)
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          throw new Error(`Unknown step: ${step}`)
      }
    }
    console.log('useEffect', recipient, amount, address, transaction)
    if (recipient !== '' && amount !== undefined && transaction) {
      console.log('Executing step', step)
      executeStep()
    }
  }, [
    address,
    step,
    recipient,
    amount,
    approve,
    errorDepositNonce,
    errorBridgeEvent,
    bridgeEvent,
    transaction,
    goError,
    reset
  ])

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
        <Stack direction="column" padding={2} spacing="20px">
          <CustomStepper
            steps={State}
            activeStep={step}
            approve={transaction?.needApprove}
          />
          <Stack
            direction="column"
            spacing="20px"
            padding={2}
            alignItems="left"
          >
            {approve && step === Steps.ApproveSpend && (
              <Approve
                currStep={Steps.ApproveSpend + 1}
                setError={handleError}
                done={() => setStep(Steps.BridgeDeposit)}
              />
            )}
            {step === Steps.BridgeDeposit && (
              <Deposit
                currStep={Steps.BridgeDeposit + 1}
                recipient={recipient}
                amount={amount}
                setError={handleError}
                done={() => setStep(Steps.WaitBridge)}
              />
            )}
            {step === Steps.WaitBridge && (
              <Typography variant="body1" fontWeight="bold">
                {Steps.WaitBridge + 1}. Waiting for Bridge ...
              </Typography>
            )}
            {step >= Steps.Done && (
              <Stack
                sx={{
                  flexDirection: 'column'
                }}
                alignItems="center"
                spacing="20px"
              >
                <Typography variant="h5" fontWeight="bold">
                  {Steps.Done + 1}. Transfer complete!
                </Typography>
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
          </Stack>
        </Stack>
      )}
    </>
  )
}

export default TransferETHToXX
