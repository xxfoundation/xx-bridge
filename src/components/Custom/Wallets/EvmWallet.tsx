import { Divider, Stack, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { Cancel } from '@mui/icons-material'
import { disconnect } from 'wagmi/actions'
import { formatBalance } from '@/utils'
import DisplayAddress from '@/components/custom/DisplayAddress'
import WrappedIcon from '@/components/custom/WrappedIcon'

interface EvmWalletProps {
  showBalance?: boolean
  disconnectButton?: boolean
  showAll?: boolean
}

const EvmWallet: React.FC<EvmWalletProps> = ({
  showBalance = true,
  disconnectButton = false,
  showAll = false
}) => {
  const { address } = useAccount()
  const { data } = useBalance({
    address,
    watch: true
  })

  const [balance, setBalance] = useState<string | undefined>()

  useEffect(() => {
    if (data) {
      setBalance(formatBalance(data.value, data.decimals, 4))
    }
  }, [data])

  return (
    <Stack
      sx={{
        flexDirection: 'row',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '16px',
        padding: '5px 10px',
        backgroundColor: 'background.grey',
        color: 'text.primary',
        fontSize: '0.9em',
        gap: '10px'
      }}
    >
      <DisplayAddress
        withAvatar
        address={address}
        truncateSize={30}
        textTransform="none"
        placement="bottom"
        fontStyle="bold"
        fontSize="15px"
        showAll={showAll}
        tooltip
      />
      <Divider
        orientation="vertical"
        flexItem
        sx={{
          height: '1em',
          width: '1px',
          backgroundColor: 'text.primary'
        }}
      />
      {showBalance && balance && (
        <Typography>
          {balance}
          {' ETH'}
        </Typography>
      )}
      {disconnectButton && (
        <WrappedIcon
          icon={<Cancel />}
          onClick={() => {
            disconnect()
          }}
        />
      )}
    </Stack>
  )
}

export default EvmWallet
