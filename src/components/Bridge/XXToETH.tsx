import { Typography, Stack, Divider, TextField } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { useAccount, useBalance, useContractRead } from 'wagmi'
import useApi from '@/plugins/substrate/hooks/useApi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import IERC20 from '../../contracts/IERC20.json'
import { formatBalance, isETHAddress } from '@/utils'
import { WRAPPED_XX_ADDRESS, ethereumMainnet, xxNetwork } from '@/consts'
import CurrencyInputField from '../Custom/CurrencyInputField'
import StyledButton from '../Custom/StyledButton'
import TransferETHToXX from './TransferETHToXX'

const XXToETH: React.FC = () => {
  const { address } = useAccount()
  const { selectedAccount } = useAccounts()
  const { api } = useApi()
  const [noxx, setNoxx] = useState<boolean>(false)
  const [input, setInput] = useState<number | null>(null)
  const [transferValue, setTransferValue] = useState<bigint>(BigInt(0))
  const [recipient, setRecipient] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string | undefined>()
  const [xxBalance, setXXBalance] = useState<string>('0')
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wrappedXXBalance, setWrappedXXBalance] = useState<string>('0')
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [startTransfer, setStartTransfer] = useState<boolean>(false)

  // Can't send xx -> eth when no xx account is available
  useEffect(() => {
    if (!selectedAccount) {
      setNoxx(true)
    } else {
      setNoxx(false)
    }
  }, [startTransfer, selectedAccount])

  // Value computation
  const setValue = useCallback((value: number | null) => {
    setInput(value)
    if (value) {
      setTransferValue(BigInt(value * 10 ** xxNetwork.gasToken.decimals))
    }
  }, [])

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

  // Balances

  // Native xx
  useEffect(() => {
    if (selectedAccount) {
      api?.query?.system?.account(selectedAccount.address).then(({ data }) => {
        if (data) {
          const balance = data.free.add(data.reserved)
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
    address: WRAPPED_XX_ADDRESS as `0x${string}`,
    abi: IERC20.abi,
    functionName: 'balanceOf',
    args: [recipient]
  })
  useEffect(() => {
    if (recipient && !recipientError) {
      // TODO loading?
      if (wrappedXXError) {
        // TODO:
        setWrappedXXBalance('0')
      } else if (wrappedXXBal !== undefined) {
        setWrappedXXBalance(
          formatBalance(
            wrappedXXBal as bigint,
            ethereumMainnet.token?.decimals || 9,
            4
          )
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

  // Check if transfer is allowed
  useEffect(() => {
    if (transferValue && recipient && !recipientError) {
      setAllowTransfer(true)
    } else {
      setAllowTransfer(false)
    }
  }, [transferValue, recipient, recipientError])

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
        width: '640px',
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
        </Stack>
      )}
      {!noxx && !startTransfer && (
        <>
          <Stack direction="column" padding={2} justifyContent="center">
            <Typography>From: </Typography>
            <Typography>{selectedAccount?.address}</Typography>
            <Typography>Native xx Balance: </Typography>
            <Typography>
              {xxBalance} {xxNetwork.gasToken.code}
            </Typography>
            <Typography>From (ETH): </Typography>
            <Typography>{address}</Typography>
            <Typography>ETH Balance: </Typography>
            <Typography>
              {ethBalance} {ethereumMainnet.gasToken.code}
            </Typography>
            <Divider />
            <Stack direction="row" padding={2} justifyContent="center">
              <CurrencyInputField
                code={xxNetwork.gasToken.code}
                balance={parseFloat(xxBalance)}
                value={input}
                setValue={setValue}
              />
            </Stack>
          </Stack>
          <Stack
            direction="column"
            spacing={2}
            padding={2}
            justifyContent="center"
          >
            <Typography>Recipient</Typography>
            <TextField
              label="Enter ETH address"
              placeholder="0x..."
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
                  color: 'rgb(255, 255, 255, 0.5)'
                },
                border: '0.5px solid',
                borderColor: 'background.paper',
                borderRadius: '8px'
              }}
            />
            <Typography>Wrapped XX Balance: </Typography>
            <Typography>
              {wrappedXXBalance} {ethereumMainnet.token.code}
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
            {/* <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>
              {fees === '0'
                ? 'Fill in valid amount and recipient to estimate fees'
                : `~ ${fees} ${network.gasToken.code}`}
            </Typography> */}
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
        // TODO: change this component to the reverse flow
        <TransferETHToXX
          approve={false}
          recipient={recipient}
          amount={transferValue}
          reset={reset}
        />
      )}
    </Stack>
  )
}

export default XXToETH
