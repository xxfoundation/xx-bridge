import {
  Typography,
  Stack,
  Divider,
  TextField,
  useMediaQuery,
  Tooltip,
  CircularProgress,
  Link
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useContractRead, useFeeData } from 'wagmi'
import useApi from '@/plugins/substrate/hooks/useApi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import contracts from '@/contracts'
import { formatBalance, isETHAddress, shortenHash } from '@/utils'
import {
  BRIDGE_ID_ETH_MAINNET,
  BRIDGE_ID_XXNETWORK,
  BRIDGE_RELAYER_FEE_ADDRESS,
  GAS_ESTIMATE_RELAYER_FEE,
  WRAPPED_XX_ADDRESS,
  ethereumMainnet,
  xxNetwork
} from '@/consts'
import CurrencyInputField from '../custom/CurrencyInputField'
import StyledButton from '../custom/StyledButton'
import theme from '@/theme'
import Balance from '../custom/Balance'
import ModalWrapper from '../Modals/ModalWrapper'
import Loading from '../Utils/Loading'
import useXxBalance from '@/hooks/useXxBalance'
import Status from './ProgressBar/Status'
import { useAppSelector, useAppDispatch } from '@/plugins/redux/hooks'
import { getTxFromAddress } from '@/plugins/redux/selectors'
import { RootState } from '@/plugins/redux/types'
import { actions, emptyState } from '@/plugins/redux/reducers'
import { State } from './ProgressBar/XXToETH'
import useLocalStorage from '@/hooks/useLocalStorage'

const XXToETH: React.FC = () => {
  // Hooks
  const { address } = useAccount()
  const { selectedAccount, connectWallet, hasExtensions } = useAccounts()
  const { xxBalance } = useXxBalance(selectedAccount?.address || '')
  const { api, ready } = useApi()

  // State
  const [noxx, setNoxx] = useState<boolean>(false)
  const [input, setInput] = useState<number | null>(null)
  const [transferValue, setTransferValue] = useState<bigint>(BigInt(0))
  const [valueError, setError] = useState<string | undefined>()
  const [recipient, setRecipient] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string | undefined>()
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wrappedXXBalance, setWrappedXXBalance] = useState<string>('0')
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [startTransfer, setStartTransfer] = useLocalStorage<boolean>(
    `transfer-${address}`,
    false
  )
  const [gasPrice, setGasPrice] = useState<number>()
  const [fees, setFees] = useState<string>('0')
  const [xxFee, setXXFee] = useState<string>('0')
  const [resetting, setResetting] = useState<boolean>(false)

  // Check screen checkpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))

  // use redux
  const tx = useAppSelector(
    (state: RootState) => address && getTxFromAddress(state, address)
  )
  // const fromNative = useAppSelector(
  //   (state: RootState) => address && getFromNativeFromAddress(state, address)
  // )
  const dispatch = useAppDispatch()

  // Can't send xx -> eth when no xx account is available
  useEffect(() => {
    if (!selectedAccount) {
      setNoxx(true)
    } else {
      setNoxx(false)
    }
  }, [startTransfer, selectedAccount])

  // Value computation
  const setValue = useCallback(
    (value: number | null) => {
      // TODO: Parsing from BN to number can overflow if the value is bigger than Number.MAX_SAFE_INTEGER (9007199254740991) ~ 9e15 ~ 9M xx
      if (value !== null && value > parseFloat(xxBalance.toString())) {
        setError('Exceeds balance')
      } else if (value !== null && value < 1) {
        setError('Minimum amount is 1')
      } else if (value !== null && value > 1000000) {
        setError('Maximum amount is 9,000,000 (9 Million) xx')
      } else {
        setError(undefined)
        if (value) {
          setTransferValue(BigInt(value * 10 ** xxNetwork.gasToken.decimals))
        }
      }
      setInput(value)
    },
    [xxBalance]
  )

  // Set recipient to ETH account
  useEffect(() => {
    if (address) {
      setRecipient(address)
    }
  }, [address, startTransfer])

  // Validate recipient
  const validateRecipient = useCallback((value: string) => {
    if (!isETHAddress(value)) {
      setRecipientError('Invalid address')
    } else {
      setRecipientError(undefined)
    }
    setRecipient(value)
  }, [])

  // Network fees
  const { isError: feeError, isLoading: feeLoading } = useFeeData({
    watch: true,
    onSuccess: data => {
      if (data.gasPrice) {
        // Add 10% for faster txs
        setGasPrice(Number(data.gasPrice) * 1.1)
      }
    },
    onError: (error: Error) => {
      console.error('Error fetching fee data:', error)
      setGasPrice(undefined)
    }
  })

  // Get current relayer fee from contract
  const {
    data: relayerFee,
    isError: relayerFeeError,
    isLoading: relayerFeeLoading
  } = useContractRead({
    address: BRIDGE_RELAYER_FEE_ADDRESS,
    abi: contracts.relayerFeeAbi,
    functionName: 'currentFee',
    watch: true
  })

  /* -------------------------------------------------------------------------- */
  /*                            Get account balances                            */
  /* -------------------------------------------------------------------------- */

  // ETH
  const { isError: ethError, isLoading: ethLoading } = useBalance({
    address,
    watch: true,
    onSuccess: (data: any) => {
      if (data) {
        setEthBalance(formatBalance(data.value, data.decimals, 4))
      }
    },
    onError: (error: Error) => {
      console.error('Error fetching ETH balance', error)
      setEthBalance('0')
    }
  })

  // Wrapped xx (when recipient set)
  const {
    isError: wrappedXXError,
    isLoading: wrappedXXLoading,
    refetch: refetchWrappedXX
  } = useContractRead({
    address: WRAPPED_XX_ADDRESS,
    abi: contracts.ierc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    watch: true,
    onSuccess: (data: any) => {
      if (data !== undefined) {
        setWrappedXXBalance(
          formatBalance(data.toString(), ethereumMainnet.token.decimals, 4)
        )
      }
    },
    onError: (error: Error) => {
      console.error('Error fetching wrapped XX balance', error)
      setWrappedXXBalance('0')
    }
  })

  // Set fees
  useEffect(() => {
    if (
      api &&
      ready &&
      allowTransfer &&
      gasPrice &&
      transferValue &&
      recipient &&
      selectedAccount &&
      relayerFee
    ) {
      // Gas fee + relayer fee
      const fee =
        BigInt((GAS_ESTIMATE_RELAYER_FEE * gasPrice).toFixed(0)) + relayerFee
      setFees(formatBalance(fee, 18, 6))
      // Tx fee for xx swap.transferNative call
      const extrinsic = api.tx.swap.transferNative(
        transferValue,
        recipient,
        BRIDGE_ID_ETH_MAINNET
      )
      extrinsic.paymentInfo(selectedAccount.address).then(({ partialFee }) => {
        setXXFee(
          formatBalance(partialFee.toString(), xxNetwork.gasToken.decimals, 6)
        )
      })
    } else {
      setFees('0')
      setXXFee('0')
    }
  }, [
    api,
    ready,
    allowTransfer,
    gasPrice,
    transferValue,
    recipient,
    selectedAccount,
    relayerFee
  ])

  // Update loading state
  const loadingState = useMemo(() => {
    switch (true) {
      case ethLoading:
        return 'Fetching ETH balance...'
      case wrappedXXLoading:
        return 'Fetching wrapped XX balance...'
      case feeLoading:
        return 'Fetching network fees...'
      case relayerFeeLoading:
        return 'Fetching relayer fee...'
      default:
        return ''
    }
  }, [ethLoading, wrappedXXLoading, feeLoading, relayerFeeLoading])

  // Update error state
  const errorState = useMemo(() => {
    switch (true) {
      case ethError:
        return 'Error fetching ETH balance'
      case wrappedXXError:
        return 'Error fetching wrapped XX balance'
      case feeError:
        return 'Error fetching network fees'
      case relayerFeeError:
        return 'Error fetching relayer fee'
      default:
        return ''
    }
  }, [ethError, wrappedXXError, feeError, relayerFeeError])

  // Check if transfer is allowed
  useEffect(() => {
    if (
      transferValue &&
      !valueError &&
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
    recipient,
    recipientError,
    loadingState,
    errorState
  ])

  // Reset Tx details
  const resetTxDetails = useCallback(() => {
    setStartTransfer(false)
    setInput(null)
    setTransferValue(BigInt(0))
  }, [])

  // Reset
  const reset = useCallback(() => {
    setResetting(true)
    resetTxDetails()
    setRecipient('')
    setRecipientError(undefined)
    refetchWrappedXX()
    dispatch(actions.resetTxDetails(address))
    setTimeout(() => {
      setResetting(false)
    }, 2000)
  }, [address, dispatch, refetchWrappedXX, resetTxDetails])

  // // useQuery hook to get the latest bridge transfers
  // const { data: latestTransfers, isLoading: latestTransfersLoading } =
  //   useQuery<GetBridgeTransfers>(GET_BRIDGE_TRANSFERS, {
  //     variables: {
  //       account: address,
  //       limit: 10
  //     },
  //     skip: !address || fromNative?.txHash === undefined
  //   })

  // Restore transaction from local storage and set values if status not complete (4)
  useEffect(() => {
    resetTxDetails()
    setRecipient(address || '')
    if (tx && JSON.stringify(tx) !== JSON.stringify(emptyState.tx)) {
      if (tx.status.step < 5 && tx.destinationAddress) {
        setRecipient(tx.destinationAddress)
        // Set transfer value passed as string to children components
        setTransferValue(BigInt(tx.amount))
        // Set input value to be displayed in the input field
        setInput(parseFloat(tx.amount) / 10 ** xxNetwork.gasToken.decimals)
        setStartTransfer(true)
      } else {
        console.log('Transaction already complete')
        dispatch(actions.resetKey(address))
      }
    } else {
      console.log('No transaction found')
    }
  }, [tx, address])

  // Do not leave recipient empty
  useEffect(() => {
    if (recipient === '' && address) {
      setRecipient(address)
    }
  }, [address, recipient])

  const handleClickTransfer = useCallback(() => {
    setStartTransfer(true)
    dispatch(
      actions.setTxDetails({
        key: address,
        details: {
          status: State[0],
          sourceAddress: selectedAccount?.address || '',
          destinationAddress: recipient,
          sourceId: BRIDGE_ID_XXNETWORK,
          destinationId: BRIDGE_ID_ETH_MAINNET,
          amount: transferValue.toString(),
          needApproval: false
        }
      })
    )
  }, [
    address,
    dispatch,
    recipient,
    resetTxDetails,
    selectedAccount,
    transferValue
  ])

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
      {noxx || !selectedAccount?.address ? (
        <Stack
          direction="column"
          padding={4}
          spacing={2}
          justifyContent="center"
        >
          {!hasExtensions && (
            <>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                No xx wallet found
              </Typography>
              <Typography>
                Please install one of the following wallets and reload the page
                in order to connect your account and transfer native xx
              </Typography>
              <Stack direction="row" spacing={4} padding={1}>
                <Link
                  variant="h6"
                  href="https://www.talisman.xyz/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Talisman
                </Link>
                <Link
                  variant="h6"
                  href="https://www.subwallet.app/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  SubWallet
                </Link>
              </Stack>
            </>
          )}
          {hasExtensions && (
            <StyledButton onClick={connectWallet}>
              Connect xx Wallet
            </StyledButton>
          )}
        </Stack>
      ) : (
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
                  <Tooltip placement="top" title={selectedAccount?.address}>
                    <Typography>
                      {shortenHash(selectedAccount?.address)}
                    </Typography>
                  </Tooltip>
                ) : (
                  selectedAccount?.address
                )}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Balance
                icon={xxNetwork.gasToken.symbol}
                balance={
                  <>
                    {formatBalance(xxBalance.toString(), 9, 4)}{' '}
                    {xxNetwork.gasToken.code}
                  </>
                }
                title="XX"
              />
              <Balance
                icon={ethereumMainnet.gasToken.symbol}
                balance={
                  <>
                    {ethBalance} {ethereumMainnet.gasToken.code}
                  </>
                }
                title="ETH"
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
                  {wrappedXXBalance} {ethereumMainnet.token.code}
                </b>
              </Typography>
            </Stack>
            {!startTransfer ? (
              <TextField
                placeholder="0x..."
                variant="standard"
                value={recipient}
                error={!!recipientError}
                helperText={recipientError || 'Enter ETH address'}
                disabled={startTransfer}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  validateRecipient(event.target.value)
                }}
                sx={{
                  width: '100%',
                  marginBottom: '1em',
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
              code={xxNetwork.gasToken.code}
              balance={parseFloat(xxBalance.toString())}
              value={input}
              setValue={setValue}
              error={valueError}
            />
          </Stack>
          <Divider />
          <Stack sx={{ textAlign: 'left', paddingLeft: '10px' }}>
            <Stack direction="column" padding={2}>
              <Typography
                sx={{
                  fontWeight: 'bold'
                }}
              >
                Estimated fees
              </Typography>
              <Typography sx={{ fontSize: '14px', color: 'text.primary' }}>
                {fees === '0' &&
                  'Fill in valid amount and recipient to estimate fees'}
              </Typography>
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              paddingLeft={1}
              paddingRight={2}
            >
              <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>
                {xxFee !== '0' && `~ ${xxFee} ${xxNetwork.gasToken.code}`}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>
                {fees !== '0' && `~ ${fees} ${ethereumMainnet.gasToken.code}`}
              </Typography>
            </Stack>
          </Stack>
          {startTransfer && recipient ? (
            <Status sourceId={BRIDGE_ID_XXNETWORK} reset={reset} />
          ) : (
            <Stack direction="row" padding={2} justifyContent="center">
              <StyledButton
                fullWidth
                disabled={!allowTransfer}
                onClick={handleClickTransfer}
              >
                Transfer
              </StyledButton>
            </Stack>
          )}
        </>
      )}
    </Stack>
  )
}

export default XXToETH
