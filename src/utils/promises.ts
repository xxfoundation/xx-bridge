import { simulateContract, writeContract } from 'wagmi/actions'
import { SimulateContractReturnType, SimulateContractParameters } from 'viem'
import { wagmiConfig } from '@/plugins/wagmi'

const customWriteContract = async (
  config: SimulateContractParameters
): Promise<string> => {
  let data: SimulateContractReturnType
  try {
    data = await simulateContract(wagmiConfig, config)
  } catch (error) {
    console.error(`Error simulating contract write:`, error)
    throw new Error(`Simulating contract write: ${error}`)
  }

  try {
    const hash = await writeContract(wagmiConfig, data.request)
    return hash
  } catch (error) {
    console.error(`Error writing contract:`, error)
    throw new Error(`Writing contract: ${error}`)
  }
}

export default customWriteContract
