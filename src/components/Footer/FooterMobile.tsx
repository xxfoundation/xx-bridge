import { Divider, IconButton, Stack, Typography } from '@mui/material'
import React from 'react'
import { X, Telegram } from '@mui/icons-material'
import discordLogo from '@/assets/socials/discord.svg'
import xxNetworkLogo from '@/assets/xxnetwork/xxnetworkLogo.svg'
import StyledStack from '../Custom/StyledStack'

const FooterMobile: React.FC = () => (
  <StyledStack endHeight centerWidth>
    <Stack alignItems="center">
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={3}>
          <Stack spacing={1} alignItems="center">
            <Typography sx={{ fontWeight: 'bold' }}>POWERED BY</Typography>
            <img src={xxNetworkLogo} alt="discord" height="20px" />
          </Stack>
        </Stack>
      </Stack>
      <Divider />
      <Stack justifyContent="space-between" spacing={1}>
        <Typography sx={{ fontSize: '11px' }}>
          Copyright © 2022 xx labs SEZC
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          paddingBottom="10px"
          justifyContent="space-between"
        >
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
            onClick={() =>
              window.open('https://discord.com/invite/Y8pCkbK', '_blank')
            }
          >
            <img src={discordLogo} alt="discord" width="20px" height="20px" />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  </StyledStack>
)

export default FooterMobile
