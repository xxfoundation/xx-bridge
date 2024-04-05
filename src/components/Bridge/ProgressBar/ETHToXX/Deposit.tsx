import { Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi'
import { waitForTransaction } from 'wagmi/actions'
import contracts from '@/contracts'
import {
  BRIDGE_ADDRESS,
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RESOURCE_ID_XX
} from '@/consts'
import { encodeBridgeDeposit } from '@/utils'
import { CustomStep } from '../Stepper'
import useLocalStorage from '@/hooks/useLocalStorage'
import { Transaction, updateTransaction } from '../Status'
import StyledButton from '@/components/custom/StyledButton'

interface DepositProps {
  currStep: number
  recipient: string
  amount: bigint
  setError: (message: string) => void
  done: () => void
}

enum State {
  Init = 0,
  Prompt = 1,
  Sign = 2,
  Wait = 3,
  Done = 4
}

const Steps: CustomStep[] = [
  {
    step: State.Init,
    message: 'Initializing deposit...'
  },
  {
    step: State.Prompt,
    message: 'Prompted user to sign deposit...'
  },
  {
    step: State.Sign,
    message: 'Waiting for deposit to be signed...'
  },
  {
    step: State.Wait,
    message: 'Waiting for deposit block confirmations (3)...'
  },
  {
    step: State.Done,
    message: 'Deposit complete'
  }
]

const Deposit: React.FC<DepositProps> = ({
  currStep,
  recipient,
  amount,
  setError,
  done
}) => {
  // Hooks
  const { address } = useAccount()
  const [step, setStep] = useState<CustomStep>(Steps[State.Init])
  const [prompted, setPrompted] = useState<boolean>(false)

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

  // Reset state + call setError prop
  const resetState = useCallback(
    (msg: string) => {
      setStep(Steps[State.Init])
      setError(msg)
    },
    [setError]
  )

  // Bridge deposit call
  const deposit = useMemo(
    () => encodeBridgeDeposit(recipient, amount),
    [recipient, amount]
  )
  const {
    config: configDeposit,
    error: errorDepositPrepare,
    status: statusPrepareContractWrite
  } = usePrepareContractWrite({
    address: BRIDGE_ADDRESS,
    abi: contracts.bridgeAbi,
    functionName: 'deposit',
    args: [BRIDGE_ID_XXNETWORK, BRIDGE_RESOURCE_ID_XX, deposit],
    account: address
  })
  const {
    data: dataDeposit,
    write: callDeposit,
    isLoading: isLoadingDeposit,
    error: errorDepositWrite
  } = useContractWrite(configDeposit)

  // State machine
  useEffect(() => {
    const executeStep = async () => {
      switch (step.step) {
        /* -------------------------------- Init ------------------------------- */
        case State.Init: {
          if (transaction) {
            setStep(Steps[transaction.fromEth?.depositState ?? State.Init])
          }

          // If contract write error, reset state else prompt user to deposit
          if (errorDepositPrepare) {
            console.error(`Error deposit:`, errorDepositPrepare)
            resetState(`Error depositing: ${errorDepositPrepare.name}`)
          } else if (statusPrepareContractWrite === 'success') {
            setStep(Steps[State.Prompt])
          }
          break
        }

        /* -------------------------------- Prompt ----------------------------- */
        case State.Prompt: {
          console.log(`Prompting user to deposit...`, transaction)
          // if deposit tx hash exists on local storage go to wait state
          if (transaction?.fromEth?.depositTxHash) {
            setStep(Steps[State.Wait])
            break
          }
          // call deposit
          if (callDeposit && !isLoadingDeposit) {
            callDeposit()
            setStep(Steps[State.Sign])
            updateTransaction(
              setTransaction,
              ['fromEth', 'depositState'],
              State.Sign
            )
          }
          break
        }

        /* -------------------------------- Sign ------------------------------ */
        case State.Sign: {
          console.log(`Waiting for deposit to be signed...`)
          if (errorDepositWrite) {
            console.error(`Error executing depositing: ${errorDepositWrite}}`)
            resetState(`Error executing depositing: ${errorDepositWrite.name}`)
          }
          if (dataDeposit?.hash) {
            updateTransaction(
              setTransaction,
              ['fromEth', 'depositState'],
              State.Wait
            )
            updateTransaction(
              setTransaction,
              ['fromEth', 'depositTxHash'],
              dataDeposit.hash as `0x${string}`
            )
            setStep(Steps[State.Wait])
          }
          break
        }

        /* -------------------------------- Wait ------------------------------- */
        case State.Wait: {
          console.log(
            `Waiting for deposit block confirmations (3)...`,
            transaction
          )
          if (transaction?.fromEth?.depositTxHash) {
            try {
              console.log(
                `Waiting for deposit:`,
                transaction?.fromEth?.depositTxHash
              )
              const depositReceipt = await waitForTransaction({
                hash: transaction?.fromEth?.depositTxHash as `0x${string}`,
                confirmations: 3
              })
              if (depositReceipt) {
                console.log(`Deposit receipt:`, depositReceipt)
                setStep(Steps[State.Done])
              }
            } catch (err: any) {
              console.error(`Error waiting for deposit: ${err}`)
              resetState(`Error waiting for deposit: ${err.message}`)
            }
          }
          break
        }

        /* -------------------------------- Done ------------------------------- */
        case State.Done: {
          console.log(`Deposit complete`)
          done()
          break
        }

        /* -------------------------------------------------------------------------- */
        default:
          throw new Error(`Unknown step: ${step}`)
      }
    }
    if (address && transaction) {
      executeStep()
    }
  }, [
    step,
    address,
    transaction,
    errorDepositPrepare,
    isLoadingDeposit,
    statusPrepareContractWrite,
    isLoadingDeposit,
    errorDepositWrite,
    dataDeposit,
    callDeposit,
    setTransaction,
    resetState,
    done
  ])

  return (
    <Stack direction="column" spacing="5px" padding={2} alignItems="left">
      <Typography variant="body1" fontWeight="bold">
        {currStep}. Deposit
      </Typography>
      <Typography variant="body2">{step.message}</Typography>
      {step.step === State.Sign && !errorDepositWrite && (
        <Stack
          sx={{
            flexDirection: 'column',
            marginTop: '20px !important'
          }}
          spacing="10px"
        >
          <Typography variant="body2">
            Please confirm the transaction in your wallet. If you do not see a
            confirmation prompt to sign this transaction, please check your
            wallet settings or try again by pressing the button below. Make sure
            you do not have any queued transactions in your wallet before
            proceeding.
          </Typography>
          <StyledButton
            onClick={() => {
              setStep(Steps[State.Prompt])
              setPrompted(true)
            }}
            disabled={isLoadingDeposit || prompted}
            small
          >
            {prompted ? 'Trying Deposit...' : 'Retry Deposit'}
          </StyledButton>
        </Stack>
      )}
    </Stack>
  )
}

export default Deposit
