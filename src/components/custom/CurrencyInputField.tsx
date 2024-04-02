import React from 'react'
import { InputBase, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import StyledButton from './StyledButton'

interface CurrencyInputFieldProps {
  code: string
  balance: number
  value: number | null
  setValue: (value: number | null) => void
  error: string | undefined
}

const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  code,
  balance,
  value,
  setValue,
  error
}) => (
  <Stack marginTop="10px" spacing={1} alignItems="center">
    {error && (
      <Typography
        sx={{ color: 'error.light', fontSize: '13px', textAlign: 'left' }}
      >
        {error}
      </Typography>
    )}
    <Stack
      direction="row"
      margin="15px 0 5px 0"
      spacing={1}
      sx={{
        backgroundColor: error ? 'error.main' : 'background.paper',
        padding: '10px',
        borderRadius: '30px',
        height: '25px',
        maxWidth: '300px',
        alignItems: 'center'
      }}
    >
      <InputBase
        placeholder="0"
        defaultValue={0}
        endAdornment={
          <Typography sx={{ color: 'text.primary', fontSize: '0.9em' }}>
            {code}
          </Typography>
        }
        type="number"
        inputProps={{ min: 1 }}
        sx={{
          width: '100%',
          paddingLeft: '10px',
          color: 'primary.contrastText',
          fontWeight: 'bold'
        }}
        value={value || ''}
        onChange={e => {
          if (e.target.value === '') {
            setValue(null)
          } else {
            setValue(Number(e.target.value))
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
    <Typography sx={{ color: 'text.primary', fontSize: '13px' }}>
      Note: Minimum transfer of 1 {code} because it is the existential deposit
      to keep the account active in the xx network blockchain.
    </Typography>
  </Stack>
)

export default CurrencyInputField
