import { InputBase, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useState, useEffect } from 'react'
import StyledButton from './StyledButton'

interface CurrencyInputFieldProps {
  code: string
  balance: number
  value: number | null
  setValue: (value: number | null) => void
}

const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  code,
  balance,
  value,
  setValue
}) => {
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (value !== null && value > balance) {
      setError('Exceeds balance')
    } else if (value !== null && value < 1) {
      setError('Minimum amount is 1')
    } else {
      setError(undefined)
    }
  }, [value, code])

  return (
    <Stack marginTop="10px" spacing={1}>
      <Stack
        direction="row"
        margin="15px 0 5px 0"
        spacing={1}
        alignItems="center"
        sx={{
          backgroundColor: error ? 'error.main' : 'background.paper',
          padding: '10px',
          borderRadius: '30px',
          height: '25px'
        }}
      >
        <InputBase
          placeholder="1"
          endAdornment={code}
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
      {error && (
        <Typography sx={{ color: 'error.light', fontSize: '13px' }}>
          {error}
        </Typography>
      )}
    </Stack>
  )
}

export default CurrencyInputField
