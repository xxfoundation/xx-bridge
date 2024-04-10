import { RootState } from './types'

// get state with specific key (address)
export const getStateFromAddress = (state: RootState, address: string) =>
  state.transactions[address]

// get tx with specific key (address)
export const getTxFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.tx

// get approval with specific key (address)
export const getApprovalFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.toNative.approval

// get deposit with specific key (address)
export const getDepositFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.toNative.deposit

// get fromNative with specific key (address)
export const getFromNativeFromAddress = (state: RootState, address: string) =>
  state.transactions[address]?.fromNative
