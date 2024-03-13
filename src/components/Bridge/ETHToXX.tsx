import React, { useCallback, useEffect, useState } from 'react'
import {
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material'
import {
  PublicClient,
  useAccount,
  useBalance,
  useConfig,
  useContractRead,
  useFeeData
} from 'wagmi'
import StyledButton from '../Custom/StyledButton'
import {
  convertXXAddress,
  encodeBridgeDeposit,
  formatBalance,
  isValidXXNetworkAddress,
  shortenHash
} from '@/utils'
import CurrencyInputField from '../Custom/CurrencyInputField'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import {
  GAS_ESTIMATE_APPROVE,
  GAS_ESTIMATE_DEPOSIT,
  BRIDGE_ADDRESS,
  BRIDGE_ERC20_HANDLER_ADDRESS,
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RESOURCE_ID_XX,
  WRAPPED_XX_ADDRESS,
  ethereumMainnet,
  xxNetwork
} from '@/consts'
import TransferETHToXX from './TransferETHToXX'
import contracts from '@/contracts'
import useApi from '@/plugins/substrate/hooks/useApi'
import theme from '@/theme'
import Balance from '../Custom/Balance'

const estimateGasBridgeDeposit = async (
  client: PublicClient,
  address: `0x${string}` | undefined,
  to: string,
  amount: bigint
): Promise<bigint | undefined> => {
  // Encode the deposit data
  const data = encodeBridgeDeposit(to, amount)
  try {
    const gas = await client.estimateContractGas({
      address: BRIDGE_ADDRESS,
      abi: contracts.bridgeAbi,
      functionName: 'deposit',
      args: [BRIDGE_ID_XXNETWORK, BRIDGE_RESOURCE_ID_XX, data],
      account: address || '0x'
    })
    return gas
  } catch (error) {
    return undefined
  }
}

const ETHToXX: React.FC = () => {
  // Hooks
  const { address } = useAccount()
  const { publicClient } = useConfig()
  const { selectedAccount } = useAccounts()
  const { api } = useApi()

  // State
  const [input, setInput] = useState<number | null>(null)
  const [transferValue, setTransferValue] = useState<bigint>(BigInt(0))
  const [valueError, setError] = useState<string | undefined>()
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string | undefined>()
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wrappedXXBalance, setWrappedXXBalance] = useState<string>('0')
  const [xxBalance, setXXBalance] = useState<string>('0')
  const [needAllowance, setNeedAllowance] = useState<boolean>(false)
  const [startTransfer, setStartTransfer] = useState<boolean>(false)
  const [gasPrice, setGasPrice] = useState<number>()
  const [fees, setFees] = useState<string>('0')

  // Check screen checkpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))

  // Value computation
  const setValue = useCallback(
    (value: number | null) => {
      if (value !== null && value > parseFloat(wrappedXXBalance)) {
        setError('Exceeds balance')
      } else if (value !== null && value < 1) {
        setError('Minimum amount is 1')
      } else {
        setError(undefined)
        if (value) {
          setTransferValue(BigInt(value * 10 ** ethereumMainnet.token.decimals))
        }
      }
      setInput(value)
    },
    [wrappedXXBalance]
  )

  // Set recipient to xx account if connected
  useEffect(() => {
    if (selectedAccount) {
      setRecipient(selectedAccount.address)
    }
  }, [selectedAccount, startTransfer])

  // Validate recipient
  const validateRecipient = useCallback((value: string) => {
    if (!isValidXXNetworkAddress(value)) {
      setRecipientError('Invalid address')
    } else {
      setRecipientError(undefined)
    }
    setRecipient(value)
  }, [])

  // Network fees
  const {
    data: feeData,
    isError: feeError,
    isLoading: feeLoading
  } = useFeeData({
    watch: true
  })
  useEffect(() => {
    // TODO loading?
    if (feeError) {
      // TODO:
    } else if (feeData !== undefined && feeData.gasPrice) {
      // Add 10% for faster txs
      setGasPrice(Number(feeData.gasPrice) * 1.1)
    }
  }, [feeData, feeError, feeLoading])

  // Get account balances

  // ETH
  const {
    data: ethBal,
    isError: ethError,
    isLoading: ethLoading
  } = useBalance({
    address,
    watch: true
  })
  useEffect(() => {
    // TODO loading?
    if (ethError) {
      // TODO:
      setEthBalance('0')
    } else if (ethBal !== undefined) {
      // When the balance is updated refetch wrapped xx ones
      setEthBalance(formatBalance(ethBal.value, ethBal.decimals, 4))
    }
  }, [ethBal, ethError, ethLoading])

  // Wrapped xx

  // Balance
  const {
    data: wrappedXXBal,
    isError: wrappedXXError,
    isLoading: wrappedXXLoading,
    refetch: refetchWrappedXX
  } = useContractRead({
    address: WRAPPED_XX_ADDRESS,
    abi: contracts.ierc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`]
  })
  useEffect(() => {
    // TODO loading?
    if (wrappedXXError) {
      // TODO:
      setWrappedXXBalance('0')
    } else if (wrappedXXBal !== undefined) {
      setWrappedXXBalance(
        formatBalance(wrappedXXBal, ethereumMainnet.token.decimals, 4)
      )
    }
  }, [wrappedXXBal, wrappedXXError, wrappedXXLoading])

  // Allowance
  const {
    data: wrappedXXAllowance,
    isError: wrappedXXAllowanceError,
    isLoading: wrappedXXAllowanceLoading,
    refetch: refetchAllowance
  } = useContractRead({
    address: WRAPPED_XX_ADDRESS,
    abi: contracts.ierc20Abi,
    functionName: 'allowance',
    args: [address as `0x${string}`, BRIDGE_ERC20_HANDLER_ADDRESS]
  })
  useEffect(() => {
    // TODO loading?
    if (wrappedXXAllowanceError) {
      // TODO:
      setNeedAllowance(false)
    } else if (wrappedXXAllowance !== undefined && input) {
      if (parseFloat(wrappedXXAllowance.toString()) < input) {
        setNeedAllowance(true)
      } else {
        setNeedAllowance(false)
      }
    } else {
      setNeedAllowance(false)
    }
  }, [
    wrappedXXAllowance,
    wrappedXXAllowanceError,
    wrappedXXAllowanceLoading,
    input
  ])

  // Native xx (when recipient set)
  useEffect(() => {
    if (recipient && !recipientError) {
      api?.query?.system?.account(recipient).then(({ data }) => {
        if (data) {
          const balance = data.free.add(data.reserved)
          setXXBalance(formatBalance(balance.toString(), 9, 4))
        }
      })
    }
  }, [recipient, recipientError, api?.query?.system?.account])

  // Compute fees
  useEffect(() => {
    if (allowTransfer && gasPrice) {
      // If need approve call, then can't estimate bridge deposit since it will
      // fail without the allowance
      // This way, just use the fixed more conservative gas estimates
      if (needAllowance) {
        const fee = (GAS_ESTIMATE_APPROVE + GAS_ESTIMATE_DEPOSIT) * gasPrice
        setFees(formatBalance(BigInt(fee), 18, 6))
      } else if (transferValue && recipient) {
        estimateGasBridgeDeposit(
          publicClient,
          address,
          convertXXAddress(recipient),
          transferValue
        ).then(gas => {
          if (gas) {
            console.log('Bridge gas estimate', gas)
            const fee = Number(gas) * gasPrice
            setFees(formatBalance(BigInt(fee), 18, 6))
          } else {
            setFees('0')
          }
        })
      }
    } else {
      setFees('0')
    }
  }, [needAllowance, transferValue, recipient, allowTransfer, gasPrice])

  // Check if transfer is allowed
  useEffect(() => {
    if (transferValue && !valueError && recipient && !recipientError) {
      setAllowTransfer(true)
    } else {
      setAllowTransfer(false)
    }
  }, [transferValue, valueError, recipient, recipientError])

  // Reset
  const reset = useCallback(() => {
    setInput(null)
    setTransferValue(BigInt(0))
    setRecipient('')
    setRecipientError(undefined)
    setStartTransfer(false)
    refetchWrappedXX()
    refetchAllowance()
  }, [refetchWrappedXX, refetchAllowance])

  return (
    <Stack
      sx={{
        backgroundColor: 'background.dark',
        borderRadius: '18px'
      }}
    >
      {!startTransfer && address && (
        <>
          <Stack
            direction="column"
            padding={2}
            justifyContent="center"
            spacing={1}
          >
            <Stack>
              <Typography sx={{ fontWeight: 'bold' }}>From </Typography>
              <Typography
                sx={{
                  fontFamily: 'monospace',
                  backgroundColor: 'background.grey',
                  width: 'fit-content',
                  padding: '3px 5px',
                  borderRadius: '8px'
                }}
              >
                {isMobile ? (
                  <Tooltip placement="top" title={selectedAccount?.address}>
                    <Typography>{shortenHash(address)}</Typography>
                  </Tooltip>
                ) : (
                  address
                )}
              </Typography>
            </Stack>
            <Typography sx={{ fontWeight: 'bold', paddingTop: '10px' }}>
              Balance
            </Typography>
            <Stack direction="row" spacing={1}>
              <Balance
                icon={ethereumMainnet.gasToken.symbol}
                balance={
                  <>
                    {ethBalance} {ethereumMainnet.gasToken.code}
                  </>
                }
                title="ETH"
              />
              <Balance
                icon={ethereumMainnet.token.symbol}
                balance={
                  <>
                    {wrappedXXBalance} {ethereumMainnet.token.code}
                  </>
                }
                title="Wrapped XX"
              />
            </Stack>
          </Stack>
          <Divider />

          <Stack
            direction="column"
            spacing={2}
            padding={2}
            justifyContent="center"
          >
            <Typography
              sx={{
                fontWeight: 'bold'
              }}
            >
              Recipient
            </Typography>
            <TextField
              label="Enter xx address"
              placeholder="6..."
              variant="outlined"
              value={recipient}
              error={!!recipientError}
              helperText={recipientError || ''}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                validateRecipient(event.target.value)
              }}
              sx={{
                width: '100%',
                marginBottom: '1em',
                input: {
                  color: 'text.primary',
                  '::placeholder': {
                    opacity: 0.5
                  }
                },
                label: {
                  color: 'rgb(0, 255, 255, 0.5)'
                },
                border: '0.5px solid',
                borderColor: 'background.paper',
                borderRadius: '8px'
              }}
            />
          </Stack>
          <Stack direction="row" padding={2} justifyContent="center">
            <CurrencyInputField
              code={ethereumMainnet.token.code}
              balance={parseFloat(wrappedXXBalance)}
              value={input}
              setValue={setValue}
              error={valueError}
            />
          </Stack>
          <Stack alignItems="center">
            <Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Native XX Balance
            </Typography>
            <Typography sx={{ fontWeight: 'bold', fontSize: '25px' }}>
              {xxBalance} {xxNetwork.gasToken.code}
            </Typography>
          </Stack>
          <Divider />
          <Stack sx={{ textAlign: 'left', paddingLeft: '10px' }}>
            <Typography
              sx={{
                fontWeight: 'bold',
                fontSize: '15px',
                color: 'text.primary'
              }}
            >
              Estimated fees
            </Typography>
            <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>
              {fees === '0'
                ? 'Fill in valid amount and recipient to estimate fees'
                : `~ ${fees} ${ethereumMainnet.gasToken.code}`}
            </Typography>
          </Stack>
          <Stack direction="row" padding={2} justifyContent="center">
            <StyledButton
              fullWidth
              disabled={!allowTransfer}
              onClick={() => setStartTransfer(true)}
            >
              Transfer
            </StyledButton>
          </Stack>
        </>
      )}
      {startTransfer && (
        <TransferETHToXX
          approve={needAllowance}
          recipient={convertXXAddress(recipient)}
          amount={transferValue}
          reset={reset}
        />
      )}
    </Stack>
  )
}

export default ETHToXX
