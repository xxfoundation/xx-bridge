import {
  Divider,
  IconButton,
  Stack,
  StackProps,
  Typography
} from '@mui/material'
import React from 'react'
import { X, Telegram } from '@mui/icons-material'
import theme from '@/theme'
import ButtonLink from '../custom/ButtonLink'
import discordLogo from '@/assets/socials/discord.svg'
import xxNetworkLogo from '@/assets/xxnetwork/xxnetworkLogo.svg'

interface FooterProps extends StackProps {}

const Footer: React.FC<FooterProps> = props => (
  <Stack sx={{ backgroundColor: 'background.dark' }} {...props}>
    <Stack direction="row" justifyContent="space-between">
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>
            POWERED BY
          </Typography>
          <a
            href="https://xx.network/"
            style={{ height: 'fit-content', width: 'fit-content' }}
          >
            <img src={xxNetworkLogo} alt="discord" height="13px" />
          </a>
        </Stack>
      </Stack>
      <Stack>
        <Stack direction="row" spacing={2}>
          <ButtonLink
            text="xx network"
            onClick={() => window.open('https://xx.network/', '_blank')}
            noUnderline
          />
          <ButtonLink
            text="phoenixx"
            onClick={() => window.open('https://phoenixx.io/', '_blank')}
            noUnderline
            secondaryColor
          />
          <ButtonLink
            text="xx hub"
            onClick={() => window.open('https://hub.xx.network/', '_blank')}
            noUnderline
          />
          <ButtonLink
            text="xx wallet"
            onClick={() => window.open('https://wallet.xx.network/', '_blank')}
            noUnderline
          />
        </Stack>
      </Stack>
    </Stack>
    <Divider />
    <Stack direction="row" justifyContent="space-between">
      <Typography sx={{ fontSize: '11px', width: '88%' }}>
        xx Network does not distribute, offer, solicit sales of, or sell any xx
        coins in any state or jurisdiction in which such a distribution, offer,
        solicitation or sale would be unlawful prior to registration or
        qualification under the securities laws of any such state or
        jurisdiction. Copyright © 2024 xx Foundation |{' '}
        <a
          href="https://xx.network/privacy-policy/"
          style={{ color: theme.palette.primary.main }}
        >
          Privacy Policy
        </a>{' '}
        &{' '}
        <a
          href="https://xx.network/terms-of-use/"
          style={{ color: theme.palette.primary.main }}
        >
          Term of Use
        </a>
      </Typography>
      <Stack direction="row" spacing={2}>
        <IconButton
          sx={{
            backgroundColor: 'background.grey',
            width: '30px',
            height: '30px',
            color: 'text.primary'
          }}
          onClick={() =>
            window.open('https://twitter.com/xx_network', '_blank')
          }
        >
          <X sx={{ width: '20px' }} />
        </IconButton>
        <IconButton
          sx={{
            backgroundColor: 'background.grey',
            width: '30px',
            height: '30px',
            color: 'text.primary'
          }}
          onClick={() => window.open('https://t.me/xxnetwork', '_blank')}
        >
          <Telegram sx={{ width: '20px' }} />
        </IconButton>
        <IconButton
          sx={{
            backgroundColor: 'background.grey',
            width: '30px',
            height: '30px',
            color: 'text.primary'
          }}
          onClick={() => window.open('https://discord.xx.network', '_blank')}
        >
          <img src={discordLogo} alt="discord" width="20px" height="20px" />
        </IconButton>
      </Stack>
    </Stack>
  </Stack>
)

export default Footer
