import { InputBase, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useState, useEffect } from 'react'
import StyledButton from './StyledButton'
import { Currency } from '@/utils'

interface CurrencyInputFieldProps {
  currencyInfo: Currency
  fromTo: boolean
  value: number
  setValue: React.Dispatch<React.SetStateAction<number>>
}

const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  currencyInfo,
  fromTo,
  value,
  setValue
}) => {
  const [exceedsBalance, setExceedsBalance] = useState<boolean>(false)

  useEffect(() => {
    if (value > currencyInfo.balance && fromTo) {
      setExceedsBalance(true)
    } else {
      setExceedsBalance(false)
    }
    console.log('value:', value)
  }, [value, currencyInfo, fromTo])

  return (
    <Stack marginTop="10px" spacing={1}>
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
          inputProps={{ min: 0 }}
          sx={{
            width: '100%',
            paddingLeft: '10px',
            color: 'primary.contrastText',
            fontWeight: 'bold'
          }}
          value={value}
          onChange={e => {
            console.log('e.target.value:', e.target.value)
            setValue(Number(e.target.value))
          }}
        />
        {fromTo && (
          <StyledButton
            sx={{ height: '30px', backgroundColor: 'background.grey' }}
            onClick={() => setValue(currencyInfo.balance)}
          >
            Max
          </StyledButton>
        )}
      </Stack>
      {exceedsBalance && (
        <Typography sx={{ color: 'error.light', fontSize: '13px' }}>
          Exceeds balance
        </Typography>
      )}
    </Stack>
  )
}

export default CurrencyInputField
