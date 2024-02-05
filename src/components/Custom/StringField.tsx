import { Stack, Typography, TypographyProps } from '@mui/material'
import React from 'react'

interface StringFieldProps extends TypographyProps {
  label?: string
  value: string | undefined | null
  isHash?: boolean
}

const StringField: React.FC<StringFieldProps> = ({
  label,
  value,
  isHash = false,
  ...props
}) => {
  // remove sx from props
  const { sx, ...rest } = props
  return (
    <Stack direction="column" alignItems="left" spacing={label ? 1 : 0}>
      {label && (
        <Typography
          variant="body1"
          sx={{
            color: 'text.primary',
            fontWeight: 'bold',
            ...sx
          }}
        >
          {label}
        </Typography>
      )}
      <Typography
        variant="h5"
        {...rest}
        sx={{
          borderRadius: '5px',
          padding: '5px 10px',
          backgroundColor: 'background.grey',
          color: 'text.primary',
          fontFamily: isHash ? 'monospace' : '',
          ...sx
        }}
      >
        {value || 'N/A'}
      </Typography>
    </Stack>
  )
}

export default StringField
