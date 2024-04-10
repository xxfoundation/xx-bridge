import store from './store'

export type AppDispatch = typeof store.dispatch

export type CustomStep = {
  step: number
  message: string
}

export interface Transfer {
  status: CustomStep
  sourceAddress: string
  destinationddress: string
  sourceId: number
  destinationId: number
  amount: string
  needApproval: boolean
}

/* -------------------------------------------------------------------------- */
/*                            To Native (EVM -> XX)                           */
/* -------------------------------------------------------------------------- */
export interface ApprovalInfo {
  status: CustomStep
  txHash: string | `0x${string}` | undefined
}
export interface DepositInfo {
  status: CustomStep
  txHash: string | `0x${string}` | undefined
}
export interface ToNative {
  approval: ApprovalInfo
  deposit: DepositInfo
}

/* -------------------------------------------------------------------------- */
/*                           From Native (XX -> EVM)                          */
/* -------------------------------------------------------------------------- */
export interface FromNative {
  status: CustomStep
  nonce: number
  txHash: string | `0x${string}` | undefined
}

/* ------------------------------------ - ----------------------------------- */
export type BridgeTx = {
  tx: Transfer
  toNative: ToNative
  fromNative: FromNative
}

export interface RootState {
  transactions: {
    [key: string]: BridgeTx
  }
}
