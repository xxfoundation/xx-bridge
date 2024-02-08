import React, { useEffect, useState } from 'react'
import { ArrowDownward, ArrowUpward, ShowChart } from '@mui/icons-material'
import { Divider, IconButton, Stack, Typography } from '@mui/material'
import StyledButton from '../Custom/StyledButton'
import { ConversionRates, Currency } from '@/utils'
import NetworkInfo from './NetworkInfo'

interface TransferCardProps {
  from: Currency
  to: Currency
}

const TransferCard: React.FC<TransferCardProps> = ({ from, to }) => {
  const [fromTo, setFromTo] = useState<boolean>(true)
  const [input, setInput] = useState<number | null>(null)
  const [output, setOutput] = useState<number | null>(null)
  const [allowTransfer, setAllowTransfer] = useState<boolean>(false)

  // TODO: rates to be pulled
  const conversionRates: ConversionRates = {
    XX: {
      ETH: 0.0001
    },
    ETH: {
      XX: 0.0002
    }
  }

  // use effect that will update the output value when the input value changes
  useEffect(() => {
    if (input === null) return
    if (fromTo) {
      setOutput(input * conversionRates[from.code][to.code])
    } else {
      setOutput(input / conversionRates[to.code][from.code])
    }
  }, [input])

  // use effect that will update the input value when the output value changes
  useEffect(() => {
    if (output === null) return
    if (fromTo) {
      setInput(output / conversionRates[from.code][to.code])
    } else {
      setInput(output * conversionRates[to.code][from.code])
    }
  }, [output, fromTo])

  // use effect that will update the allowTransfer value when the input value changes
  useEffect(() => {
    if (input === null) return
    if (input > 0 && input <= from.balance && fromTo) {
      setAllowTransfer(true)
    } else if (input > 0 && input <= to.balance && !fromTo) {
      setAllowTransfer(true)
    } else setAllowTransfer(false)
  }, [input, fromTo])

  return (
    <Stack
      sx={{
        width: '360px',
        backgroundColor: 'background.dark',
        borderRadius: '18px'
      }}
    >
      <Stack
        padding="30px"
        sx={{
          backgroundColor: 'background.grey',
          borderRadius: ' 18px  18px 0 0',
          position: 'relative'
        }}
      >
        <Typography sx={{ fontWeight: 'bold', fontSize: '18px' }}>
          {fromTo ? `Sell ${from.code}` : `Buy ${from.code}`}
        </Typography>
        <Stack direction="row" spacing={0.2} alignItems="center">
          <ShowChart sx={{ color: 'primary.main' }} />
          <Typography
            sx={{ fontSize: '13px', color: 'primary.main', fontWeight: 'bold' }}
          >
            1 {from.code} ={' '}
            {fromTo
              ? conversionRates[from.code][to.code]
              : conversionRates[to.code][from.code]}{' '}
            {to.code}
          </Typography>
        </Stack>
        <Stack spacing={2} marginTop="15px">
          <Typography sx={{ fontWeight: 'bold', fontSize: '15px' }}>
            {fromTo ? 'From' : 'To'}
          </Typography>
          <NetworkInfo
            currencyInfo={from}
            fromTo={fromTo}
            value={fromTo ? input : Number(output?.toFixed(4))}
            setValue={fromTo ? setInput : setOutput}
          />
        </Stack>
        <IconButton
          sx={{
            backgroundColor: 'primary.main',
            borderRadius: '50%',
            padding: '8px',
            width: '40px',
            height: '40px',
            position: 'absolute',
            bottom: -20,
            right: '45%',
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
          onClick={() => setFromTo(prev => !prev)}
        >
          {fromTo ? (
            <ArrowDownward sx={{ color: 'background.paper' }} />
          ) : (
            <ArrowUpward sx={{ color: 'background.paper' }} />
          )}
        </IconButton>
      </Stack>
      <Stack>
        <Stack spacing={2} padding="30px">
          <Typography sx={{ fontWeight: 'bold', fontSize: '15px' }}>
            {fromTo ? 'To' : 'From'}
          </Typography>
          <NetworkInfo
            currencyInfo={to}
            fromTo={!fromTo}
            value={fromTo ? Number(output?.toFixed(4)) : input}
            setValue={fromTo ? setOutput : setInput}
          />
        </Stack>
        <Divider />
        <Stack sx={{ textAlign: 'right', paddingRight: '30px' }}>
          <Typography
            sx={{
              fontWeight: 'bold',
              fontSize: '13px',
              color: 'text.primary'
            }}
          >
            Estimated transfer fees
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
    </Stack>
  )
}

export default TransferCard
