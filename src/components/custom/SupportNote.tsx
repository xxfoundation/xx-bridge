import { Link, Typography, TypographyProps } from '@mui/material'
import React from 'react'
import { BRIDGE_GUIDE_URL, SUPPORT_EMAIL } from '@/consts'

const SupportNote: React.FC<TypographyProps> = props => (
  <Typography variant="body2" {...props}>
    Need help? Read the{' '}
    <Link href={BRIDGE_GUIDE_URL} target="_blank" rel="noopener noreferrer">
      bridge guide
    </Link>{' '}
    or email <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>.
    Nobody from xx network will message you first.
  </Typography>
)

export default SupportNote
