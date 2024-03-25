import {
  Typography,
  Stack,
  Divider,
  TextField,
  useMediaQuery,
  Tooltip
} from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { useAccount, useBalance, useContractRead, useFeeData } from 'wagmi'
import useApi from '@/plugins/substrate/hooks/useApi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import contracts from '@/contracts'
import { formatBalance, isETHAddress, shortenHash } from '@/utils'
import {
  BRIDGE_ID_ETH_MAINNET,
  BRIDGE_RELAYER_FEE_ADDRESS,
  GAS_ESTIMATE_RELAYER_FEE,
  WRAPPED_XX_ADDRESS,
  ethereumMainnet,
  xxNetwork
} from '@/consts'
import CurrencyInputField from '../custom/CurrencyInputField'
import StyledButton from '../custom/StyledButton'
import TransferXXToETH from './TransferXXToETH'
import theme from '@/theme'
import Balance from '../custom/Balance'

const XXToETH: React.FC = () => {
  const { address } = useAccount()
  const { selectedAccount, connectWallet } = useAccounts()
  const { api } = useApi()
  const [noxx, setNoxx] = useState<boolean>(false)
  const [input, setInput] = useState<number | null>(null)
  const [transferValue, setTransferValue] = useState<bigint>(BigInt(0))
  const [valueError, setError] = useState<string | undefined>()
  const [recipient, setRecipient] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string | undefined>()
  const [xxBalance, setXXBalance] = useState<string>('0')
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wrappedXXBalance, setWrappedXXBalance] = useState<string>('0')
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [startTransfer, setStartTransfer] = useState<boolean>(false)
  const [gasPrice, setGasPrice] = useState<number>()
  const [fees, setFees] = useState<string>('0')
  const [xxFee, setXXFee] = useState<string>('0')

  // Check screen checkpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))

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
      if (value !== null && value > parseFloat(xxBalance)) {
        setError('Exceeds balance')
      } else if (value !== null && value < 1) {
        setError('Minimum amount is 1')
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

  // Get current relayer fee from contract
  const {
    data: relayerFee
    // isError: relayerFeeError, // TODO: use this?
    // isLoading: relayerFeeLoading, // TODO: use this?
  } = useContractRead({
    address: BRIDGE_RELAYER_FEE_ADDRESS,
    abi: contracts.relayerFeeAbi,
    functionName: 'currentFee'
  })

  // Balances

  // Native xx
  useEffect(() => {
    if (selectedAccount) {
      api?.query?.system?.account(selectedAccount.address).then(({ data }) => {
        if (data) {
          const frozen = data.miscFrozen.gt(data.feeFrozen)
            ? data.miscFrozen
            : data.feeFrozen
          const balance = data.free.sub(frozen)
          setXXBalance(formatBalance(balance.toString(), 9, 4))
        }
      })
    }
  }, [startTransfer, selectedAccount, api?.query?.system?.account])

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

  // Wrapped xx (when recipient set)
  const {
    data: wrappedXXBal,
    isError: wrappedXXError,
    isLoading: wrappedXXLoading,
    refetch: refetchWrappedXX
  } = useContractRead({
    address: WRAPPED_XX_ADDRESS,
    abi: contracts.ierc20Abi,
    functionName: 'balanceOf',
    args: [recipient as `0x${string}`]
  })
  useEffect(() => {
    if (recipient && !recipientError) {
      // TODO loading?
      if (wrappedXXError) {
        // TODO:
        setWrappedXXBalance('0')
      } else if (wrappedXXBal !== undefined) {
        setWrappedXXBalance(
          formatBalance(wrappedXXBal, ethereumMainnet.token?.decimals || 9, 4)
        )
      }
    }
  }, [
    wrappedXXBal,
    wrappedXXError,
    wrappedXXLoading,
    recipient,
    recipientError
  ])

  // Set fees
  useEffect(() => {
    if (
      api &&
      allowTransfer &&
      gasPrice &&
      transferValue &&
      recipient &&
      selectedAccount &&
      relayerFee
    ) {
      // Gas fee + relayer fee
      const fee = BigInt(GAS_ESTIMATE_RELAYER_FEE * gasPrice) + relayerFee
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
    allowTransfer,
    gasPrice,
    transferValue,
    recipient,
    selectedAccount,
    relayerFee
  ])

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
  }, [refetchWrappedXX])

  return (
    <Stack
      sx={{
        backgroundColor: 'background.dark',
        borderRadius: '18px'
      }}
    >
      {noxx && (
        <Stack
          direction="column"
          padding={4}
          spacing={2}
          justifyContent="center"
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            No xx account available
          </Typography>
          <Typography>
            Please install Subwallet or Polkadot-js extension and reload the
            page in order to connect your account and transfer native xx
          </Typography>
          <StyledButton onClick={connectWallet}>Connect xx Wallet</StyledButton>
        </Stack>
      )}
      {!noxx && !startTransfer && selectedAccount?.address && (
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
                    {xxBalance} {xxNetwork.gasToken.code}
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
            <TextField
              placeholder="0x..."
              variant="standard"
              value={recipient}
              error={!!recipientError}
              helperText={recipientError || 'Enter ETH address'}
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
          </Stack>
          <Stack direction="row" padding={2} justifyContent="center">
            <CurrencyInputField
              code={xxNetwork.gasToken.code}
              balance={parseFloat(xxBalance)}
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
      {!noxx && startTransfer && (
        <TransferXXToETH
          recipient={recipient}
          amount={transferValue}
          reset={reset}
        />
      )}
    </Stack>
  )
}

export default XXToETH
