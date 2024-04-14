import {
  PrepareWriteContractConfig,
  PrepareWriteContractResult,
  prepareWriteContract,
  writeContract
} from 'wagmi/actions'

const customWriteContract = async (
  config: PrepareWriteContractConfig
): Promise<string> => {
  let request: PrepareWriteContractResult
  try {
    request = await prepareWriteContract(config)
  } catch (error) {
    console.error(`Error preparing contract write:`, error)
    throw new Error(`Preparing contract write: ${error}`)
  }

  try {
    const result = await writeContract(request)
    return result.hash
  } catch (error) {
    console.error(`Error writing contract:`, error)
    throw new Error(`Writing contract: ${error}`)
  }
}

export default customWriteContract
