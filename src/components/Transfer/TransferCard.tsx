import React, { useCallback, useEffect, useState } from 'react'
import { Divider, InputBase, Stack, Typography } from '@mui/material'
import { useAccount } from 'wagmi'
import StyledButton from '../Custom/StyledButton'
import { Currency } from '@/utils'
import NetworkInfo from './NetworkInfo'
import CurrencyInputField from '../Custom/CurrencyInputField'
import useAccounts from '@/plugins/substrate/hooks/useAccounts'
import Loading from '../Utils/Loading'

interface TransferCardProps {
  from: Currency
  to: Currency
}

const TransferCard: React.FC<TransferCardProps> = ({ from, to }) => {
  const { address } = useAccount()
  const { selectedAccount } = useAccounts()
  const [switching, setSwitching] = useState<boolean>(false)
  const [input, setInput] = useState<number | null>(null)
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [source, setSource] = useState<Currency>(from)
  const [dest, setDest] = useState<Currency>(to)

  useEffect(() => {
    if (source.code === 'wXX' && selectedAccount) {
      setRecipient(selectedAccount.address)
    } else if (address) {
      setRecipient(address)
    }
    setAllowTransfer(true)
  }, [source, address, selectedAccount])

  // Switch networks
  const switchNetworks = useCallback(() => {
    setSwitching(true)
    setTimeout(() => {
      setSource(dest)
      setDest(source)
      setSwitching(false)
    }, 2000)
  }, [source, dest])

  return (
    <Stack
      sx={{
        width: '640px',
        backgroundColor: 'background.dark',
        borderRadius: '18px'
      }}
    >
      {!switching && (
        <>
          <NetworkInfo
            source={source}
            dest={dest}
            setSwitching={() => {
              setInput(null)
              switchNetworks()
            }}
          />
          <Divider />
          <Stack spacing={2} padding={5}>
            <Typography>Amount</Typography>
            <CurrencyInputField
              currencyInfo={source}
              balance={source.code === 'wXX' ? 1 : 10}
              value={input}
              setValue={setInput}
            />
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
          </Stack>
          <Stack direction="row" padding={2} justifyContent="center">
            <StyledButton fullWidth disabled={!allowTransfer}>
              Transfer
            </StyledButton>
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
