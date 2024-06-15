import { RootState } from './types'

// get state with specific key (address)
export const getStateFromAddress = (state: RootState, address: string) =>
  state.transactions[address]

// get tx with specific key (address)
export const getTxFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.tx

// get bridgeTxHash with specific key (address)
export const getBridgeTxHashFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.bridgeTxHash

// get approval with specific key (address)
export const getApprovalFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.toNative.approval

// get deposit with specific key (address)
export const getDepositFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.toNative.deposit

// get nativeTransfer with specific key (address)
export const getNativeTransferFromAddress = (
  state: RootState,
  address: string
) => state.transactions[address]?.fromNative.nativeTransfer

// get feePayment with specific key (address)
export const getFeePaymentFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.fromNative.feePayment
