import { simulateContract, writeContract } from 'wagmi/actions'
import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  SimulateContractReturnType,
  SimulateContractParameters,
  UserRejectedRequestError
} from 'viem'
import { wagmiConfig } from '@/plugins/wagmi'
import { SUPPORT_EMAIL } from '@/consts'

// Revert reason of RelayerFeeReceiver.payFee when msg.value != currentFee
const FEE_CHANGED_REASON = 'Fee value is not correct'
const MAX_ERROR_LENGTH = 140

const firstLineCapped = (message: string): string => {
  const line = message.split('\n')[0].trim()
  return line.length > MAX_ERROR_LENGTH
    ? `${line.slice(0, MAX_ERROR_LENGTH - 1)}…`
    : line
}

// Turn a failed simulation or write into one short line the user can act on.
// Errors are thrown untouched by customWriteContract so the viem error class
// survives to here.
export const describeWriteError = (error: unknown): string => {
  if (error instanceof BaseError) {
    if (error.walk(e => e instanceof UserRejectedRequestError)) {
      return 'You rejected the transaction in your wallet.'
    }
    if (error.walk(e => e instanceof InsufficientFundsError)) {
      return 'Not enough ETH to cover the fee and gas.'
    }
    // viem also files a plain -32603 under "reverted" (wallets report reverts
    // that way), so only a decoded revert is called a failing transaction.
    const revert = error.walk(e => e instanceof ContractFunctionRevertedError)
    if (revert instanceof ContractFunctionRevertedError && revert.reason) {
      if (revert.reason.includes(FEE_CHANGED_REASON)) {
        return 'The relayer fee changed. Press Retry.'
      }
      return firstLineCapped(
        revert.data ? `Transaction would fail: ${revert.reason}` : revert.reason
      )
    }
    if (error.shortMessage) {
      return firstLineCapped(error.shortMessage)
    }
  }
  if (error instanceof Error && error.message) {
    return firstLineCapped(error.message)
  }
  return `Something went wrong. Press Retry, or email ${SUPPORT_EMAIL}.`
}

const customWriteContract = async (
  config: SimulateContractParameters
): Promise<string> => {
  let data: SimulateContractReturnType
  try {
    data = await simulateContract(wagmiConfig, config)
  } catch (error) {
    console.error(`Error simulating contract write:`, error)
    throw error
  }

  try {
    const hash = await writeContract(wagmiConfig, data.request)
    return hash
  } catch (error) {
    console.error(`Error writing contract:`, error)
    throw error
  }
}

export default customWriteContract
