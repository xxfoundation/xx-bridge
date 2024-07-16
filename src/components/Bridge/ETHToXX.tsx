import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material'
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useReadContract,
  useEstimateFeesPerGas
} from 'wagmi'
import StyledButton from '../custom/StyledButton'
import {
  convertXXAddress,
  convertXXPubkey,
  formatBalance,
  isValidXXNetworkAddress,
  shortenHash
} from '@/utils'
import CurrencyInputField from '../custom/CurrencyInputField'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import {
  GAS_ESTIMATE_APPROVE,
  GAS_ESTIMATE_DEPOSIT,
  BRIDGE_ERC20_HANDLER_ADDRESS,
  BRIDGE_ID_XXNETWORK,
  WRAPPED_XX_ADDRESS,
  ethereumMainnet,
  xxNetwork,
  BRIDGE_ID_ETH_MAINNET
} from '@/consts'
import contracts from '@/contracts'
import theme from '@/theme'
import Balance from '../custom/Balance'
import Loading from '../Utils/Loading'
import ModalWrapper from '../Modals/ModalWrapper'
import Status from './ProgressBar/Status'
import useXxBalance from '@/hooks/useXxBalance'
import { useAppSelector, useAppDispatch } from '@/plugins/redux/hooks'
import { RootState } from '@/plugins/redux/types'
import { actions } from '@/plugins/redux/reducers'
import { getTxFromAddress } from '@/plugins/redux/selectors'
import { State } from './ProgressBar/ETHToXX'

const RecipientBalance: React.FC<{ recipient: string }> = ({ recipient }) => {
  const { xxBalance } = useXxBalance(recipient || '')
  const displayBalance = useMemo(
    () => formatBalance(xxBalance.toString(), xxNetwork.gasToken.decimals, 4),
    [xxBalance]
  )

  return (
    <Stack
      flexDirection="row"
      justifyContent="space-between"
      alignItems="baseline"
    >
      <Typography
        sx={{
          fontWeight: 'bold',
          fontSize: '20px'
        }}
      >
        Recipient
      </Typography>
      <Typography sx={{ fontSize: '14px' }} alignSelf="baseline">
        Balance:{' '}
        <b>
          {displayBalance} {xxNetwork.gasToken.code}
        </b>
      </Typography>
    </Stack>
  )
}

interface ETHToXXProps {
  ethPrice?: string
}

const ETHToXX: React.FC<ETHToXXProps> = ({ ethPrice }) => {
  // Hooks
  const { address } = useAccount()
  const { selectedAccount } = useAccounts()

  // State
  const [input, setInput] = useState<number | null>(null)
  const [transferValue, setTransferValue] = useState<bigint>(BigInt(0))
  const [valueError, setError] = useState<string | undefined>()
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string | undefined>()
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wrappedXXBalance, setWrappedXXBalance] = useState<string>('0')
  const [allowance, setAllowance] = useState<string>()
  const [needApprove, setNeedApprove] = useState<boolean>(false)
  const [gasPrice, setGasPrice] = useState<number>()
  const [fees, setFees] = useState<string>('0')
  const [feesError, setFeesError] = useState<string | undefined>()
  const [resetting, setResetting] = useState<boolean>(false)

  // Check screen checkpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))

  // use redux
  const tx = useAppSelector(
    (state: RootState) => address && getTxFromAddress(state, address)
  )
  const dispatch = useAppDispatch()

  // check if transfer is in progress
  const startTransfer = useMemo(() => !!(tx && tx.status.step > 0), [tx])

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
        } else {
          setTransferValue(BigInt(0))
        }
      }
      setInput(value)
    },
    [wrappedXXBalance]
  )

  // Validate recipient
  const validateRecipient = useCallback((value: string) => {
    if (!isValidXXNetworkAddress(value)) {
      setRecipientError('Invalid address')
    } else {
      setRecipientError(undefined)
    }
    setRecipient(value)
  }, [])

  /* -------------------------------------------------------------------------- */
  /*                            Get account balances                            */
  /* -------------------------------------------------------------------------- */

  // Network fees
  const {
    data: feeData,
    isError: feeError,
    isLoading: feeLoading,
    refetch: refetchFees
  } = useEstimateFeesPerGas()

  // ETH
  const {
    data: ethData,
    isError: ethError,
    isLoading: ethLoading,
    refetch: refetchBalance
  } = useBalance({ address })

  // Wrapped XX
  const {
    data: wrappedXXData,
    isError: wrappedXXError,
    isLoading: wrappedXXLoading,
    refetch: refetchWrappedXX
  } = useReadContract({
    address: WRAPPED_XX_ADDRESS,
    abi: contracts.ierc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`]
  })

  // Allowance
  const {
    data: wrappedXXAllowanceData,
    isError: wrappedXXAllowanceError,
    isLoading: wrappedXXAllowanceLoading
  } = useReadContract({
    address: WRAPPED_XX_ADDRESS,
    abi: contracts.ierc20Abi,
    functionName: 'allowance',
    args: [address as `0x${string}`, BRIDGE_ERC20_HANDLER_ADDRESS]
  })

  // Set values and errors
  useEffect(() => {
    // Gas fee
    if (feeData) {
      // Add 10% for faster txs
      if (feeData.gasPrice) {
        setGasPrice(Number(feeData.gasPrice) * 1.1)
      } else if (feeData.maxFeePerGas) {
        setGasPrice(Number(feeData.maxFeePerGas) * 1.1)
      } else {
        console.error('Error fetching gas price', feeData)
        setGasPrice(undefined)
      }
    }
    // ETH Balance
    if (ethData) {
      setEthBalance(formatBalance(ethData.value, ethData.decimals, 4))
    } else if (ethError) {
      console.error('Error fetching ETH balance', ethError)
      setEthBalance('0')
    }
    // Wrapped XX Balance
    if (wrappedXXData !== undefined) {
      setWrappedXXBalance(
        formatBalance(
          wrappedXXData.toString(),
          ethereumMainnet.token.decimals,
          4
        )
      )
    } else if (wrappedXXError) {
      console.error('Error fetching wrapped XX balance', wrappedXXError)
      setWrappedXXBalance('0')
    }
    // Wrapped XX Allowance
    if (wrappedXXAllowanceData !== undefined) {
      setAllowance(wrappedXXAllowanceData.toString())
    } else if (wrappedXXAllowanceError) {
      console.error('Error fetching allowance', wrappedXXAllowanceError)
      setAllowance(undefined)
    }
  }, [
    feeData,
    ethData,
    ethError,
    wrappedXXData,
    wrappedXXError,
    wrappedXXAllowanceData,
    wrappedXXAllowanceError
  ])

  // Refetch values every block
  // No need to refetch allowance
  const { data: blockNumber } = useBlockNumber({ watch: true })
  useEffect(() => {
    refetchFees()
    refetchBalance()
    refetchWrappedXX()
  }, [blockNumber, refetchFees, refetchBalance, refetchWrappedXX])

  // Check if needs approve
  useEffect(() => {
    if (allowance && input) {
      if (parseFloat(allowance) < input) {
        setNeedApprove(true)
      } else {
        setNeedApprove(false)
      }
    }
  }, [allowance, input])

  // Compute fees
  useEffect(() => {
    if (gasPrice) {
      const fee = (
        ((needApprove ? GAS_ESTIMATE_APPROVE : 0) + GAS_ESTIMATE_DEPOSIT) *
        gasPrice
      ).toFixed(0)
      const feeValue = formatBalance(BigInt(fee), 18, 6)
      setFees(feeValue)
      // Set fee error if balance is insufficient
      if (Number(feeValue) > Number(ethBalance)) {
        setFeesError('Insufficient ETH balance')
      } else {
        setFeesError(undefined)
      }
    } else {
      setFees('0')
      setFeesError(undefined)
    }
  }, [needApprove, gasPrice, ethBalance])

  // Update loading state
  const loadingState = useMemo(() => {
    switch (true) {
      case ethLoading:
        return 'Fetching ETH balance'
      case wrappedXXLoading:
        return 'Fetching Wrapped XX balance'
      case wrappedXXAllowanceLoading:
        return 'Fetching Wrapped XX allowance'
      case feeLoading:
        return 'Fetching network fees'
      default:
        return ''
    }
  }, [ethLoading, wrappedXXLoading, wrappedXXAllowanceLoading, feeLoading])

  // Update error state
  const errorState = useMemo(() => {
    switch (true) {
      case ethError:
        return 'Error fetching ETH balance'
      case wrappedXXError:
        return 'Error fetching Wrapped XX balance'
      case wrappedXXAllowanceError:
        return 'Error fetching Wrapped XX allowance'
      case feeError:
        return 'Error fetching network fees'
      default:
        return ''
    }
  }, [ethError, wrappedXXError, wrappedXXAllowanceError, feeError])

  // Check if transfer is allowed
  useEffect(() => {
    if (
      transferValue &&
      !valueError &&
      !feesError &&
      recipient &&
      !recipientError &&
      !loadingState &&
      !errorState
    ) {
      setAllowTransfer(true)
    } else {
      setAllowTransfer(false)
    }
  }, [
    transferValue,
    valueError,
    feesError,
    recipient,
    recipientError,
    loadingState,
    errorState
  ])

  // Reset input
  const resetInput = useCallback(() => {
    setInput(null)
    setTransferValue(BigInt(0))
  }, [])

  // Reset
  const reset = useCallback(() => {
    setResetting(true)
    resetInput()
    setRecipient('')
    setRecipientError(undefined)
    dispatch(actions.resetTxDetails(address))
    setTimeout(() => {
      setResetting(false)
    }, 2000)
  }, [address, dispatch, resetInput])

  // Restore transaction from local storage and set values if transfer ongoing
  // Otherwise, reset input and get recipient from xx wallet
  useEffect(() => {
    if (startTransfer && tx) {
      setNeedApprove(tx.needApproval)
      setRecipient(convertXXPubkey(tx.destinationAddress))
      // Set transfer value passed as string to children components
      setTransferValue(BigInt(tx.amount))
      // Set input value to be displayed in the input field
      setInput(parseFloat(tx.amount) / 10 ** ethereumMainnet.token.decimals)
    } else {
      resetInput()
      setRecipient(selectedAccount?.address || '')
    }
    return () => {
      resetInput()
    }
  }, [startTransfer, selectedAccount])

  const handleClickTransfer = useCallback(() => {
    dispatch(
      actions.setTxDetails({
        key: address,
        details: {
          status: State[1],
          sourceAddress: address || '',
          destinationAddress: convertXXAddress(recipient),
          sourceId: BRIDGE_ID_ETH_MAINNET,
          destinationId: BRIDGE_ID_XXNETWORK,
          amount: transferValue.toString(),
          needApproval: needApprove
        }
      })
    )
    // Scroll
    setTimeout(() => {
      const element = document.querySelector(`[data-id='status-stack']`)
      if (element instanceof HTMLElement) {
        element.scrollIntoView({
          behavior: 'auto',
          block: 'start',
          inline: 'start'
        })
      }
    }, 50)
  }, [address, recipient, transferValue, needApprove])

  return (
    <Stack
      sx={{
        backgroundColor: 'background.dark',
        borderRadius: '18px'
      }}
    >
      <ModalWrapper open={!!loadingState} onClose={() => {}}>
        <Loading
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#000',
            opacity: 0.8,
            zIndex: 1000,
            borderRadius: '10px',
            padding: '10%'
          }}
        >
          {loadingState}
        </Loading>
      </ModalWrapper>
      <ModalWrapper open={!!errorState} onClose={() => {}}>
        <Stack
          direction="column"
          spacing="10px"
          justifyContent="center"
          alignItems="center"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#000',
            opacity: 0.8,
            zIndex: 1000,
            borderRadius: '10px',
            padding: '10%'
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Error
          </Typography>
          <Typography>{errorState}</Typography>
          {resetting ? (
            <CircularProgress size={24} />
          ) : (
            <StyledButton onClick={reset}>Retry</StyledButton>
          )}
        </Stack>
      </ModalWrapper>
      {address && (
        <>
          <Stack
            direction="column"
            justifyContent="center"
            padding={2}
            spacing={2}
          >
            <Stack direction="column" spacing={1}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                Sender
              </Typography>
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
                  <Tooltip placement="top" title={address}>
                    <Typography>{shortenHash(address)}</Typography>
                  </Tooltip>
                ) : (
                  address
                )}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Balance
                icon={ethereumMainnet.gasToken.symbol}
                balance={<>{ethBalance}</>}
                title="ETH"
              />
              <Balance
                icon={ethereumMainnet.token.symbol}
                balance={<>{wrappedXXBalance}</>}
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
            <RecipientBalance recipient={recipient} />
            {!startTransfer ? (
              <TextField
                placeholder="6..."
                variant="standard"
                value={recipient}
                error={!!recipientError}
                helperText={
                  recipientError || recipient
                    ? 'xx network address'
                    : 'Enter xx network address'
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  validateRecipient(event.target.value)
                }}
                sx={{
                  width: '100%',
                  marginBottom: '1em',
                  '> p': {
                    color: !recipient ? 'error.main' : ''
                  },
                  input: {
                    color: 'text.primary',
                    '::placeholder': {
                      opacity: 0.7
                    }
                  }
                }}
              />
            ) : (
              <Typography
                sx={{
                  backgroundColor: 'background.grey',
                  width: 'fit-content',
                  padding: '3px 5px',
                  borderRadius: '8px'
                }}
              >
                {recipient}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" padding={2} justifyContent="center">
            <CurrencyInputField
              disabled={startTransfer}
              code={ethereumMainnet.token.code}
              balance={parseFloat(wrappedXXBalance)}
              value={input}
              setValue={setValue}
              error={valueError}
            />
          </Stack>
          <Divider />
          {startTransfer && recipient ? (
            <Status sourceId={BRIDGE_ID_ETH_MAINNET} reset={reset} />
          ) : (
            <>
              <Stack direction="column" padding={2}>
                <Typography
                  sx={{
                    fontWeight: 'bold'
                  }}
                >
                  Estimated fees
                </Typography>
                <Typography sx={{ fontSize: '14px', color: 'text.primary' }}>
                  {fees === '0'
                    ? 'Estimating fees...'
                    : `~ ${fees} ${ethereumMainnet.gasToken.code} ${ethPrice && `(${(parseFloat(ethPrice) * parseFloat(fees)).toFixed(3)} USD)`}`}
                </Typography>
                {feesError && (
                  <Typography
                    sx={{
                      color: 'error.light',
                      fontSize: '13px',
                      textAlign: 'left'
                    }}
                  >
                    {feesError}
                  </Typography>
                )}
              </Stack>
              <Stack direction="row" padding={2} justifyContent="center">
                <StyledButton
                  fullWidth
                  disabled={!allowTransfer}
                  onClick={handleClickTransfer}
                >
                  Transfer
                </StyledButton>
              </Stack>
            </>
          )}
        </>
      )}
    </Stack>
  )
}

export default ETHToXX
