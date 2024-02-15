import React, { useCallback, useEffect, useState } from 'react'
import { Divider, InputBase, Stack, Typography } from '@mui/material'
import { useAccount, useBalance } from 'wagmi'
import { BN, BN_ZERO } from '@polkadot/util'
import StyledButton from '../Custom/StyledButton'
import { Currency } from '@/utils'
import NetworkInfo from './NetworkInfo'
import CurrencyInputField from '../Custom/CurrencyInputField'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import Loading from '../Utils/Loading'
import FormatBalance from '@/plugins/substrate/components/FormatBalance'
import useApi from '@/plugins/substrate/hooks/useApi'

interface TransferCardProps {
  from: Currency
  to: Currency
}

const formatBalance = (
  balance: bigint | string,
  networkDecimals: number,
  decimals: number
): string =>
  (parseFloat(balance.toString()) * 10 ** (-1 * networkDecimals)).toFixed(
    decimals
  )

const TransferCard: React.FC<TransferCardProps> = ({ from, to }) => {
  const { address } = useAccount()
  const { selectedAccount } = useAccounts()
  const { api } = useApi()
  const [switching, setSwitching] = useState<boolean>(false)
  const [input, setInput] = useState<number | null>(null)
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [source, setSource] = useState<Currency>(from)
  const [dest, setDest] = useState<Currency>(to)
  const [noxx, setNoxx] = useState<boolean>(false)
  const [xxBalance, setXXBalance] = useState<BN>(BN_ZERO)
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wrappedXXBalance, setWrappedXXBalance] = useState<string>('0')

  useEffect(() => {
    if (source.code === 'wXX') {
      if (selectedAccount) {
        setRecipient(selectedAccount.address)
      } else {
        setRecipient('')
      }
    } else if (address) {
      setRecipient(address)
    }
    setAllowTransfer(true)
  }, [source, address, selectedAccount])

  // Can't send xx -> eth when no xx account is available
  useEffect(() => {
    if (source.code === 'XX' && !selectedAccount) {
      setNoxx(true)
    }
  }, [source, selectedAccount])

  // Switch networks
  const switchNetworks = useCallback(() => {
    setSwitching(true)
    setTimeout(() => {
      setNoxx(false)
      setSource(dest)
      setDest(source)
      setSwitching(false)
    }, 2000)
  }, [source, dest])

  // Get account balances

  // native xx
  useEffect(() => {
    if (selectedAccount) {
      api?.query.system.account(selectedAccount.address)
        .then((info) => {
          setXXBalance(info.data.free.add(info.data.reserved));
        })
        .catch((error) => console.error(error));
    }
  }, [selectedAccount, api?.query?.system?.account]);

  // ETH
  const { data } = useBalance({
    address,
    watch: true
  })

  useEffect(() => {
    if (data) {
      setEthBalance(formatBalance(data.value, data.decimals, 4))
    }
  }, [data])

  return (
    <Stack spacing={6}>
      {!switching && (
        <>
          <Stack
            sx={{
              width: '640px',
              backgroundColor: 'background.dark',
              borderRadius: '18px'
            }}
          >
            <NetworkInfo
              source={source}
              dest={dest}
              setSwitching={() => {
                setInput(null)
                switchNetworks()
              }}
            />
          </Stack>
          <Stack
            sx={{
              width: '640px',
              backgroundColor: 'background.dark',
              borderRadius: '18px'
            }}
          >
            {noxx && (
              <Stack direction="column" padding={4} spacing={2} justifyContent="center">
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  No xx account available
                </Typography>
                <Typography>
                  Please install Subwallet or Polkadot-js extension and reload the page in order to connect your account and transfer native xx
                </Typography>
              </Stack>
            )}
            {!noxx && (
              <>
                <Stack direction="column" padding={2} justifyContent="center">
                  <Typography>Amount</Typography>
                  <Stack direction="row" padding={2} justifyContent="center">
                    <CurrencyInputField
                      currencyInfo={source}
                      balance={source.code === 'wXX' ? 1 : 10}
                      value={input}
                      setValue={setInput}
                    />
                    <Typography>Balance</Typography>
                    <FormatBalance
                      value={xxBalance}
                      symbol={source.code}
                    />
                  </Stack>
                </Stack>
                <Typography>Recipient</Typography>
                <InputBase
                  placeholder={source.code === 'wXX' ? '6...' : '0x...'}
                  type="string"
                  sx={{
                    width: '100%',
                    paddingLeft: '10px',
                    color: 'primary.contrastText',
                    fontWeight: 'bold'
                  }}
                  value={recipient}
                  onChange={e => {
                    setRecipient(e.target.value)
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
                    ~ 0.0001 {from.code}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>
                    ~ 0.0001 {to.code}
                  </Typography>
                </Stack>
                <Stack direction="row" padding={2} justifyContent="center">
                  <StyledButton fullWidth disabled={!allowTransfer}>
                    Transfer
                  </StyledButton>
                </Stack>
            </>
          )}
          </Stack>
        </>
      )}
      {switching && (
        <Stack direction="column" spacing={2} padding={5} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Switching Networks
          </Typography>
          <Loading size="sm2" />
        </Stack>
      )}
    </Stack>
  )
}

export default TransferCard
