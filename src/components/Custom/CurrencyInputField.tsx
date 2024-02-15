import { InputBase, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useState, useEffect } from 'react'
import StyledButton from './StyledButton'
import { Currency } from '@/utils'

interface CurrencyInputFieldProps {
  currencyInfo: Currency
  balance: number
  value: number | null
  setValue: React.Dispatch<React.SetStateAction<number | null>>
}

const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  currencyInfo,
  balance,
  value,
  setValue
}) => {
  const [exceedsBalance, setExceedsBalance] = useState<boolean>(false)

  useEffect(() => {
    if (value && value > balance) {
      setExceedsBalance(true)
    } else {
      setExceedsBalance(false)
    }
  }, [value, currencyInfo])

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
            setValue(Number(e.target.value))
            if (e.target.value === '') {
              setValue(null)
            }
          }}
        />
        <StyledButton
          sx={{ height: '30px', backgroundColor: 'background.grey' }}
          onClick={() => setValue(balance)}
        >
          Max
        </StyledButton>
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
