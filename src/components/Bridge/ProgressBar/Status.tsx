import React, { useEffect, useMemo } from 'react'
import { Stack, Typography } from '@mui/material'
import { useAccount } from 'wagmi'
import TransferETHToXX, { Steps as StepsETHToXX } from './ETHToXX'
import TransferXXToETH, { Steps as StepsXXToETH } from './XXToETH'
import { updateNestedKeyImmutable } from '@/utils'

// transaction local storage setter function
export const setTransactionLS = (
  addr: string | undefined,
  tx: Transaction | undefined,
  setTx:
    | ((value: React.SetStateAction<Transaction | undefined>) => void)
    | undefined
) => {
  if (!addr) {
    console.error('No address found')
    return
  }
  console.log('Saving transaction in local storage (set)', tx, addr)
  try {
    if (!tx) {
      // delete the transaction from local storage
      localStorage.removeItem(`tx-${addr}`)
    } else {
      localStorage.setItem(`tx-${addr}`, JSON.stringify(tx))
    }
  } catch (err: any) {
    console.error(err)
  }
  if (setTx) {
    setTx(tx)
  }
}

// transaction local storage getter function
export const getTransactionLS = (
  addr: string | undefined,
  setTx:
    | ((value: React.SetStateAction<Transaction | undefined>) => void)
    | undefined
) => {
  if (!addr) {
    console.error('No address found')
    return null
  }
  console.log('Getting transaction from local storage', addr)
  const value = localStorage.getItem(`tx-${addr}`)
  if (value) {
    const tx = JSON.parse(value) as Transaction
    if (setTx) {
      setTx(tx)
    }
  }
  return value
}

// transaction local storage update function
export const updateTransaction = (
  addr: string | `0x${string}` | undefined,
  setValue: (value: React.SetStateAction<Transaction | undefined>) => void,
  path: string[],
  s: any
) => {
  if (!addr) {
    console.error('No address found')
    return
  }
  console.log('Saving approval tx hash in local storage (update)', s, addr)
  // get the current transaction
  const currTx = localStorage.getItem(`tx-${addr}`)
  if (!currTx) {
    console.error('No transaction found')
    return
  }
  setTransactionLS(
    addr,
    updateNestedKeyImmutable(
      JSON.parse(currTx) as Transaction,
      path,
      s
    ) as Transaction,
    setValue
  )
}

export interface Transaction {
  sourceId: 0 | 1
  needApprove: boolean
  recipient: string
  amount: string
  status: number
  fromEth: {
    approvalState: number
    approvalTxHash: string | `0x${string}`
    depositState: number
    depositTxHash: string | `0x${string}`
  }
  fromXxNative: {
    nonce: number
    txHash: string | `0x${string}`
  }
}

interface StatusProps {
  // address: string
  sourceId: 0 | 1
  approve?: boolean
  recipient: string
  amount: bigint
  reset: () => void
}

const Status: React.FC<StatusProps> = ({
  // address,
  sourceId,
  approve = false,
  recipient,
  amount,
  reset
}) => {
  const { address } = useAccount()
  // TODO: the problem lies here, because this component keeps the variables on address change and so the local storage is wrongly updated with information about the transaction the previous address was making
  console.log('all variables', address, sourceId, approve, recipient, amount)

  const fromETH = sourceId === 1
  const initStatus = useMemo(() => {
    if (!approve) {
      return fromETH ? StepsETHToXX.Init : StepsXXToETH.Init
    }
    return fromETH ? StepsETHToXX.ApproveSpend : StepsXXToETH.Init
  }, [approve, address, fromETH])

  // Update local storage with the transaction
  useEffect(() => {
    // Check if the transaction is already saved in local storage and update accordingly
    const savedTx = localStorage.getItem(`tx-${address}`)
    let status = initStatus
    let fromEth = {
      approvalState: 0,
      approvalTxHash: '',
      depositState: 0,
      depositTxHash: ''
    }
    let fromXxNative = {
      nonce: -1,
      txHash: ''
    }
    if (savedTx) {
      console.log('Found saved transaction in local storage', savedTx)
      const savedTransaction = JSON.parse(savedTx) as Transaction
      status =
        savedTransaction.status > initStatus
          ? savedTransaction.status
          : initStatus
      fromEth = savedTransaction.fromEth
      fromXxNative = savedTransaction.fromXxNative
    }

    const transaction = {
      sourceId,
      needApprove: approve,
      recipient,
      amount: amount.toString(),
      status,
      fromEth,
      fromXxNative
    } as Transaction

    console.log('transaction', transaction)
    console.log('address', address)
    if (address && transaction) {
      try {
        localStorage.setItem(`tx-${address}`, JSON.stringify(transaction))
        console.log('Saved transaction to local storage', transaction)
      } catch (error) {
        console.error('Error saving transaction to local storage', error)
      }
    } else {
      console.error('Missing address or transaction')
    }
  }, [address, sourceId, approve, recipient, amount, initStatus])

  return (
    <Stack
      sx={{
        marginTop: '10px',
        flexDirection: 'column',
        alignItems: 'center'
      }}
      spacing="20px"
    >
      <Typography variant="h5" fontWeight="bold">
        On-going Transfer Status
      </Typography>
      {fromETH ? (
        <TransferETHToXX
          approve={approve}
          recipient={recipient}
          amount={amount}
          reset={reset}
        />
      ) : (
        <TransferXXToETH recipient={recipient} amount={amount} reset={reset} />
      )}
    </Stack>
  )
}

export default Status
