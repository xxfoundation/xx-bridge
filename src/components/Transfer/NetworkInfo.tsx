import { Stack, Typography } from '@mui/material'
import { Currency } from '@/utils'
import CurrencyInputField from '../Custom/CurrencyInputField'

interface NetworkInfoProps {
  currencyInfo: Currency
  fromTo: boolean
  value: number | null
  setValue: React.Dispatch<React.SetStateAction<number | null>>
}

const NetworkInfo: React.FC<NetworkInfoProps> = ({
  currencyInfo,
  fromTo,
  value,
  setValue
}) => (
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
        <Typography sx={{ fontWeight: 'bold' }}>{currencyInfo.name}</Typography>
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
      setValue={setValue}
    />
  </Stack>
)

export default NetworkInfo
