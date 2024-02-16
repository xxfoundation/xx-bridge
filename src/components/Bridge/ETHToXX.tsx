import React, { useCallback, useEffect, useState } from 'react'
import { Divider, Stack, TextField, Typography } from '@mui/material'
import { useAccount } from 'wagmi'
import StyledButton from '../Custom/StyledButton'
import { Network, isValidXXNetworkAddress } from '@/utils'
import CurrencyInputField from '../Custom/CurrencyInputField'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import { estimateGasApprove, getETHBalance, getWrappedXXAllowance, getWrappedXXBalance } from '@/hooks/useETHCalls'
import { BRIDGE_ERC20_HANDLER_ADDRESS, MAX_UINT256 } from '@/consts'

const formatBalance = (
  balance: bigint | string,
  networkDecimals: number,
  decimals: number
): string =>
  (parseFloat(balance.toString()) * 10 ** (-1 * networkDecimals)).toFixed(
    decimals
  )

interface ETHToXXProps {
  network: Network
}

const ETHToXX: React.FC<ETHToXXProps> = ({ network }) => {
  const { address } = useAccount()
  const { selectedAccount } = useAccounts()
  const [input, setInput] = useState<number | null>(null)
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string | undefined>()
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wrappedXXBalance, setWrappedXXBalance] = useState<string>('0')
  const [needAllowance, setNeedAllowance] = useState<boolean>(false)
  const [startTransfer, setStartTransfer] = useState<boolean>(false)

  // Set recipient to xx account if connected
  useEffect(() => {
    if (selectedAccount) {
      setRecipient(selectedAccount.address)
    }
  }, [selectedAccount])

  // Validate recipient
  const validateRecipient = useCallback((value: string) => {
    if (!isValidXXNetworkAddress(value)) {
      setRecipientError('Invalid address')
    } else {
      setRecipientError(undefined)
    }
    setRecipient(value)
  }, [])

  // Get account balances

  // ETH
  const {
    data: ethBal,
    isError: ethError,
    isLoading: ethLoading
  } = getETHBalance()
  useEffect(() => {
    // TODO loading?
    if (ethError) {
      // TODO:
      setEthBalance('0')
    } else {
      if (ethBal !== undefined) {
        // When the balance is updated refetch wrapped xx ones
        setEthBalance(formatBalance(ethBal.value, ethBal.decimals, 4))
      }
    }
  }, [ethBal, ethError, ethLoading])

  // Wrapped xx

  // Balance
  const {
    data: wrappedXXBal,
    isError: wrappedXXError,
    isLoading: wrappedXXLoading
  } = getWrappedXXBalance(network.token?.address || '')
  useEffect(() => {
    // TODO loading?
    if (wrappedXXError) {
      // TODO:
      setWrappedXXBalance('0')
    } else {
      if (wrappedXXBal !== undefined) {
        setWrappedXXBalance(formatBalance(wrappedXXBal as bigint, network.token?.decimals || 9, 4))
      }
    }
  }, [wrappedXXBal, wrappedXXError, wrappedXXLoading])

  // Allowance
  const {
    data: wrappedXXAllowance,
    isError: wrappedXXAllowanceError,
    isLoading: wrappedXXAllowanceLoading
  } = getWrappedXXAllowance(network.token?.address || '', BRIDGE_ERC20_HANDLER_ADDRESS)
  useEffect(() => {
    // TODO loading?
    if (wrappedXXAllowanceError) {
      // TODO:
      setNeedAllowance(false)
    } else {
      if (wrappedXXAllowance !== undefined && input) {
        const val = wrappedXXAllowance as bigint
        if (parseFloat(val.toString()) < input) {
          setNeedAllowance(true)
        } else {
          setNeedAllowance(false)
        }
      } else {
        setNeedAllowance(false)
      }
    }
  }, [wrappedXXAllowance, wrappedXXAllowanceError, wrappedXXAllowanceLoading, input])

  // TODO: Compute fees

  // Check if transfer is allowed
  useEffect(() => {
    if (input && recipient && !recipientError) {
      setAllowTransfer(true)
    } else {
      setAllowTransfer(false)
    }
  }, [input, recipient, recipientError])

  return (
    <Stack
      sx={{
        width: '640px',
        backgroundColor: 'background.dark',
        borderRadius: '18px'
      }}
    >
      <Stack direction="column" padding={2} justifyContent="center">
        <Typography>From: </Typography>
        <Typography>{address}</Typography>
        <Typography>ETH Balance: </Typography>
        <Typography>{ethBalance} {network.gasToken.code}</Typography>
        <Typography>Wrapped XX Balance: </Typography>
        <Typography>{wrappedXXBalance} {network.token?.code || ''}</Typography>
        <Stack direction="row" padding={2} justifyContent="center">
          <CurrencyInputField
            network={network}
            balance={parseFloat(wrappedXXBalance)}
            value={input}
            setValue={setInput}
          />
        </Stack>
      </Stack>
      <Stack direction="column" spacing={2} padding={2} justifyContent="center">
        <Typography>Recipient</Typography>
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
          ~ 0.0001 {network.gasToken.code}
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
    </Stack>
  )
}

export default ETHToXX
