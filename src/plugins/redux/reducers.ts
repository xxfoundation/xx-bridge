import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BridgeTx, CustomStep, RootState, Transfer } from './types'

const emptyStep = {
  step: 0,
  message: ''
}

const emptyTx = {
  status: emptyStep,
  sourceAddress: '',
  destinationAddress: '',
  sourceId: 0,
  destinationId: 0,
  amount: '',
  needApproval: false
}

const emptyToNativeTx = {
  approval: {
    status: emptyStep,
    txHash: undefined
  },
  deposit: {
    status: emptyStep,
    txHash: undefined
  }
}

const emptyFromNativeTx = {
  nativeTransfer: {
    status: emptyStep,
    nonce: 0,
    extrinsicHash: undefined
  },
  feePayment: {
    status: emptyStep,
    txHash: undefined
  }
}

export const emptyState: BridgeTx = {
  tx: emptyTx,
  toNative: emptyToNativeTx,
  fromNative: emptyFromNativeTx,
  bridgeTxHash: undefined
}

// Define the initial state using that type
const initialState: RootState = {
  transactions: {}
}

// Getters and setters
const get = (state: RootState, key: string) => state.transactions[key]
const set = (state: RootState, key: string, value: BridgeTx) => ({
  ...state.transactions,
  [key]: value
})

export const slice = createSlice({
  name: 'bridgeTransaction',
  initialState,
  reducers: {
    // add a new key to the state with the empty state
    newKey: (state: RootState, action: PayloadAction<string | undefined>) => {
      console.log('Adding new key', action.payload)
      if (!action.payload) {
        console.error('No key provided', action.payload)
        return
      }
      state.transactions = set(state, action.payload, emptyState)
    },
    // reset the state of a given key to the empty state
    resetKey: (state, action: PayloadAction<string | undefined>) => {
      if (!action.payload) {
        console.error('No key provided', action.payload)
        return
      }
      state.transactions = set(state, action.payload, emptyState)
    },
    // reset transaction state
    resetTxDetails: (state, action: PayloadAction<string | undefined>) => {
      if (!action.payload) {
        console.error('No key provided', action.payload)
        return
      }
      const currState = get(state, action.payload)
      if (!currState) {
        console.error('No state found', action.payload)
        return
      }
      state.transactions = set(state, action.payload, {
        ...currState,
        tx: emptyTx
      })
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    incrementStepTo: (
      state,
      action: PayloadAction<{ key: string | undefined; step: CustomStep }>
    ) => {
      if (!action.payload.key) {
        console.error('No key provided', action.payload.key)
        return
      }
      console.log(
        'Incrementing step to',
        action.payload.step,
        action.payload.key
      )
      const currState = get(state, action.payload.key) || emptyState
      state.transactions = set(state, action.payload.key, {
        ...currState,
        tx: {
          ...currState.tx,
          status: action.payload.step
        }
      })
    },
    /* -------------------------------------------------------------------------- */
    /*                                     Tx                                     */
    /* -------------------------------------------------------------------------- */
    setTxStatus: (
      state,
      action: PayloadAction<{ key: string | undefined; status: CustomStep }>
    ) => {
      const { key, status } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        tx: {
          ...currState.tx,
          status
        }
      })
    },
    setTxDetails: (
      state,
      action: PayloadAction<{ key: string | undefined; details: Transfer }>
    ) => {
      const { key, details } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        tx: {
          ...currState.tx,
          ...details
        }
      })
    },
    /* -------------------------------------------------------------------------- */
    /*                                  Approval                                  */
    /* -------------------------------------------------------------------------- */
    setApprovalStatus: (
      state,
      action: PayloadAction<{ key: string | undefined; status: CustomStep }>
    ) => {
      const { key, status } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        toNative: {
          ...currState.toNative,
          approval: {
            ...currState.toNative.approval,
            status
          }
        }
      })
    },
    setApprovalTxHash: (
      state,
      action: PayloadAction<{ key: string | undefined; hash: string }>
    ) => {
      const { key, hash } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        toNative: {
          ...currState.toNative,
          approval: {
            ...currState.toNative.approval,
            txHash: hash
          }
        }
      })
    },
    /* -------------------------------------------------------------------------- */
    /*                                   Deposit                                  */
    /* -------------------------------------------------------------------------- */
    setDepositStatus: (
      state,
      action: PayloadAction<{ key: string | undefined; status: CustomStep }>
    ) => {
      const { key, status } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        toNative: {
          ...currState.toNative,
          deposit: {
            ...currState.toNative.deposit,
            status
          }
        }
      })
    },
    setDepositTxHash: (
      state,
      action: PayloadAction<{ key: string | undefined; hash: string }>
    ) => {
      const { key, hash } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        toNative: {
          ...currState.toNative,
          deposit: {
            ...currState.toNative.deposit,
            txHash: hash
          }
        }
      })
    },
    /* -------------------------------------------------------------------------- */
    /*                                 Native Transfer                            */
    /* -------------------------------------------------------------------------- */
    setNativeTransferStatus: (
      state,
      action: PayloadAction<{ key: string | undefined; status: CustomStep }>
    ) => {
      const { key, status } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        fromNative: {
          ...currState.fromNative,
          nativeTransfer: {
            ...currState.fromNative.nativeTransfer,
            status
          }
        }
      })
    },
    setNativeTransferData: (
      state,
      action: PayloadAction<{
        key: string | undefined
        nonce: number
        extrinsicHash: string
      }>
    ) => {
      const { key, nonce, extrinsicHash } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        fromNative: {
          ...currState.fromNative,
          nativeTransfer: {
            ...currState.fromNative.nativeTransfer,
            nonce,
            extrinsicHash
          }
        }
      })
    },
    /* -------------------------------------------------------------------------- */
    /*                                  Fee Payment                               */
    /* -------------------------------------------------------------------------- */
    setFeePaymentStatus: (
      state,
      action: PayloadAction<{ key: string | undefined; status: CustomStep }>
    ) => {
      const { key, status } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        fromNative: {
          ...currState.fromNative,
          feePayment: {
            ...currState.fromNative.feePayment,
            status
          }
        }
      })
    },
    setFeePaymentTxHash: (
      state,
      action: PayloadAction<{ key: string | undefined; hash: string }>
    ) => {
      const { key, hash } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        fromNative: {
          ...currState.fromNative,
          feePayment: {
            ...currState.fromNative.feePayment,
            txHash: hash
          }
        }
      })
    },
    /* -------------------------------------------------------------------------- */
    /*                        Bridge Tx Hash (from indexers)                      */
    /* -------------------------------------------------------------------------- */
    setBridgeTxHash: (
      state,
      action: PayloadAction<{ key: string | undefined; txHash: string }>
    ) => {
      const { key, txHash } = action.payload
      if (!key) {
        console.error('No key provided', key)
        return
      }
      const currState = get(state, key)
      if (!currState) {
        console.error('No state found', key)
        return
      }
      state.transactions = set(state, key, {
        ...currState,
        bridgeTxHash: txHash
      })
    }
  }
})

export const { actions } = slice
export default slice.reducer
