import React, { useCallback, useEffect, useState } from 'react'
import { Divider, InputBase, Stack, Typography } from '@mui/material'
import { useAccount } from 'wagmi'
import StyledButton from '../Custom/StyledButton'
import { Network, isValidXXNetworkAddress } from '@/utils'
import CurrencyInputField from '../Custom/CurrencyInputField'
import useApi from '@/plugins/substrate/hooks/useApi'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import { getETHBalance, getWrappedXXBalance } from '@/hooks/useETHCalls'

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
  const { api } = useApi()
  const [input, setInput] = useState<number | null>(null)
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wrappedXXBalance, setWrappedXXBalance] = useState<string>('0')
  const [insufficientTransfer, setInsufficientTransfer] = useState<boolean>(false)

  // Set recipient to xx account if connected
  useEffect(() => {
    if (selectedAccount) {
      setRecipient(selectedAccount.address)
    }
  }, [selectedAccount])

  // Validate recipient
  const validateRecipient = useCallback((value: string) => {
    isValidXXNetworkAddress(value) ? setRecipient(value) : setRecipient('')
  }, [])

  // Get account balances

  // ETH
  const { data: ethBal, isError: ethError, isLoading: ethLoading } = getETHBalance()
  useEffect(() => {
    // TODO loading?
    if (ethError) {
      // TODO:
    } else {
      if (ethBal) {
        setEthBalance(formatBalance(ethBal.value, ethBal.decimals, 4))
      }
    }
  }, [ethBal, ethError, ethLoading])
  console.log(`ETH balance: ${ethBalance}`)

  // Wrapped xx
  const { data: wrappedXXBal, isError: wrappedXXError, isLoading: wrappedXXLoading } = getWrappedXXBalance(network.token?.address || '')
  useEffect(() => {
    // TODO loading?
    if (wrappedXXError) {
      // TODO:
    } else {
      if (wrappedXXBal) {
        setWrappedXXBalance(formatBalance(wrappedXXBal as bigint, network.token?.decimals || 9, 4))
      }
    }
  }, [wrappedXXBal, wrappedXXError, wrappedXXLoading])
  console.log(`Wrapped XX balance: ${wrappedXXBalance}`)

  // Check recipient native xx existential deposit if sending less than 1 wXX
  useEffect(() => {
    if (recipient && input !== null) {
      api?.query.system.account(recipient)
        .then((info) => {
          const balance = info.data.free.add(info.data.reserved);
          if (input < 1 && balance.lt(api?.consts.balances.existentialDeposit)) {
            setInsufficientTransfer(true)
          }
        })
        .catch((error) => console.error(error));
    }
  }, [recipient, input, api?.query?.system?.account]);

  return (
    <Stack
      sx={{
        width: '640px',
        backgroundColor: 'background.dark',
        borderRadius: '18px'
      }}
    >
      <Stack direction="column" padding={2} justifyContent="center">
        <Typography>Amount</Typography>
        <Stack direction="row" padding={2} justifyContent="center">
          <CurrencyInputField
            network={network}
            balance={parseFloat(wrappedXXBalance)}
            value={input}
            setValue={setInput}
          />
          <Typography>Balance: </Typography>
          <Typography>{ethBalance} {network.gasToken.code}</Typography>
        </Stack>
      </Stack>
      <Typography>Recipient</Typography>
      <InputBase
        placeholder={'6...'}
        type="string"
        sx={{
          width: '100%',
          paddingLeft: '10px',
          color: 'primary.contrastText',
          fontWeight: 'bold'
        }}
        value={recipient}
        onChange={e => {
          validateRecipient(e.target.value)
        }}
      />
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
        <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>
          ~ 0.0001 {network.gasToken.code}
        </Typography>
      </Stack>
      <Stack direction="row" padding={2} justifyContent="center">
        <StyledButton fullWidth disabled={!allowTransfer}>
          Transfer
        </StyledButton>
      </Stack>
    </Stack>
  )
}

export default ETHToXX
