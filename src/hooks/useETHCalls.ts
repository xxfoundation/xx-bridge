import {
  useAccount,
  useBalance,
  useContractRead,
  usePrepareContractWrite
} from 'wagmi'
import IERC20 from '../contracts/IERC20.json'

export const getETHBalance = () => {
  const { address } = useAccount()
  const { data, isError, isLoading } = useBalance({
    address,
    watch: true
  })
  return { data, isError, isLoading }
}

export const getWrappedXXBalance = (contract: string) => {
  const { address } = useAccount()
  const { data, isError, isLoading } = useContractRead({
    address: contract as `0x${string}`,
    abi: IERC20.abi,
    functionName: 'balanceOf',
    args: [address]
  })
  return { data, isError, isLoading }
}

export const getWrappedXXAllowance = (contract: string, who: string) => {
  const { address } = useAccount()
  const { data, isError, isLoading } = useContractRead({
    address: contract as `0x${string}`,
    abi: IERC20.abi,
    functionName: 'allowance',
    args: [address, who]
  })
  return { data, isError, isLoading }
}

export const estimateGasApprove = (
  contract: string,
  who: string,
  amount: string
) => {
  const { address } = useAccount()
  const { data, isError, isLoading } = usePrepareContractWrite({
    address: contract as `0x${string}`,
    account: address,
    abi: IERC20.abi,
    functionName: 'approve',
    args: [who, amount]
  })
  return { data, isError, isLoading }
}
