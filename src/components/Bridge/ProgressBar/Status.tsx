import React, { useEffect, useMemo } from 'react'
import { Stack, Typography } from '@mui/material'
import TransferETHToXX, { Steps as StepsETHToXX } from './ETHToXX'
import TransferXXToETH, { Steps as StepsXXToETH } from './XXToETH'
import { updateNestedKeyImmutable } from '@/utils'

// Update local storage with the transaction
export const updateTransaction = (
  setValue: (value: React.SetStateAction<Transaction | undefined>) => void,
  path: string[],
  s: any
) => {
  console.log('Saving approval tx hash in local storage', s)
  setValue(
    prev =>
      updateNestedKeyImmutable(prev as Transaction, path, s) as Transaction
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
  fromAddr: string
  sourceId: 0 | 1
  approve?: boolean
  recipient: string
  amount: bigint
  reset: () => void
}

const Status: React.FC<StatusProps> = ({
  fromAddr,
  sourceId,
  approve = false,
  recipient,
  amount,
  reset
}) => {
  const fromETH = sourceId === 1
  const initStatus = useMemo(() => {
    if (!approve) {
      return fromETH ? StepsETHToXX.Init : StepsXXToETH.Init
    }
    return fromETH ? StepsETHToXX.ApproveSpend : StepsXXToETH.Init
  }, [approve, fromAddr, fromETH])

  const transaction = useMemo(() => {
    // Check if the transaction is already saved in local storage and update accordingly
    const savedTx = localStorage.getItem(`tx-${fromAddr}`)
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
      const savedTransaction = JSON.parse(savedTx) as Transaction
      status =
        savedTransaction.status > initStatus
          ? savedTransaction.status
          : initStatus
      fromEth = savedTransaction.fromEth
      fromXxNative = savedTransaction.fromXxNative
    }

    return {
      sourceId,
      needApprove: approve,
      recipient,
      amount: amount.toString(),
      status,
      fromEth,
      fromXxNative
    } as Transaction
  }, [sourceId, approve, recipient, amount])

  // Update local storage with the transaction
  useEffect(() => {
    console.log('transaction', transaction)
    console.log('fromAddr', fromAddr)
    if (fromAddr && transaction) {
      try {
        localStorage.setItem(`tx-${fromAddr}`, JSON.stringify(transaction))
        console.log('Saved transaction to local storage', transaction)
      } catch (error) {
        console.error('Error saving transaction to local storage', error)
      }
    } else {
      console.error('Missing fromAddr or transaction')
    }
  }, [fromAddr, transaction])

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
