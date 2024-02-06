import React, { useState } from 'react'
import { ArrowDownward, ArrowUpward, ShowChart } from '@mui/icons-material'
import {
  Divider,
  IconButton,
  InputBase,
  Stack,
  Typography
} from '@mui/material'
import StyledButton from '../Custom/StyledButton'

interface Currency {
  code: string
  name: string
  symbol: string
  balance: number
}

interface CurrencyInputFieldProps {
  currencyInfo: Currency
  fromTo: boolean
  value: number
}

const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  currencyInfo,
  fromTo,
  value
}) => {
  const [exceedsBalance, setExceedsBalance] = useState<boolean>(false)
  return (
    <Stack marginTop="10px" spacing={1}>
      {exceedsBalance && (
        <Typography sx={{ color: 'error.light', fontSize: '13px' }}>
          Exceeds balance
        </Typography>
      )}
      <Stack
        direction="row"
        margin="15px 0 5px 0"
        spacing={1}
        alignItems="center"
        sx={{
          backgroundColor: exceedsBalance ? 'error.main' : 'background.paper',
          padding: '10px',
          borderRadius: '30px',
          height: '25px'
        }}
      >
        <InputBase
          placeholder="0"
          startAdornment={fromTo ? '-' : '+'}
          endAdornment={currencyInfo.code}
          type="number"
          inputProps={{ min: 0, max: currencyInfo.balance }}
          sx={{
            width: '100%',
            paddingLeft: '10px',
            color: 'primary.contrastText',
            fontWeight: 'bold'
          }}
          value={value}
          onChange={e => {
            if (Number(e.target.value) > currencyInfo.balance) {
              setExceedsBalance(true)
            } else {
              setExceedsBalance(false)
            }
          }}
        />
        <StyledButton
          sx={{ height: '30px', backgroundColor: 'background.grey' }}
          disabled={exceedsBalance}
        >
          Max
        </StyledButton>
      </Stack>
    </Stack>
  )
}

interface NetworkInfoProps {
  currencyInfo: Currency
  fromTo: boolean
  value: number
}

const NetworkInfo: React.FC<NetworkInfoProps> = ({
  currencyInfo,
  fromTo,
  value
}) => {
  console.log(fromTo)
  return (
    <Stack>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <img
            src={currencyInfo.symbol || 'https://via.placeholder.com/25'}
            width={25}
            height={25}
            style={{ borderRadius: '50%' }}
            alt="placeholder"
          />
          <Typography sx={{ fontWeight: 'bold' }}>
            {currencyInfo.name}
          </Typography>
        </Stack>
        <Stack textAlign="right">
          <Typography
            sx={{ fontWeight: 'bold', fontSize: '13px', color: 'text.primary' }}
          >
            Balance: {currencyInfo.balance} {currencyInfo.code}
          </Typography>
        </Stack>
      </Stack>
      <CurrencyInputField
        currencyInfo={currencyInfo}
        fromTo={fromTo}
        value={value}
      />
    </Stack>
  )
}
interface TransferCardProps {
  from: Currency
  to: Currency
}

const TransferCard: React.FC<TransferCardProps> = ({ from, to }) => {
  const [fromTo, setFromTo] = useState<boolean>(true)
  const [initialFromValue] = useState<number>(0)
  const [initialToValue] = useState<number>(0)

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
            1 {from.code} = 0.0001 {to.code}
          </Typography>
        </Stack>
        <Stack spacing={2} marginTop="15px">
          <Typography sx={{ fontWeight: 'bold', fontSize: '15px' }}>
            {fromTo ? 'From' : 'To'}
          </Typography>
          <NetworkInfo
            currencyInfo={from}
            fromTo={fromTo}
            value={initialFromValue}
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
            value={initialToValue}
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
      <Stack direction="row" padding={4} justifyContent="center">
        <StyledButton fullWidth>Transfer</StyledButton>
      </Stack>
    </Stack>
  )
}

export default TransferCard
