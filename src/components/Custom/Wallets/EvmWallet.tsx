import { Stack } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useNetwork } from 'wagmi'
import { Box } from '@mui/system'
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
  const { chain } = useNetwork()
  const { data } = useBalance({
    address,
    watch: true
  })

  const [balance, setBalance] = useState<string | undefined>()
  const isGoerli = useMemo(() => chain?.name === 'Goerli', [chain])
  const symbol = useMemo(() => chain?.nativeCurrency?.symbol, [chain])

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
        padding: '5px',
        backgroundColor: 'background.grey',
        color: 'text.primary',
        fontSize: '0.9em'
      }}
    >
      {showBalance && balance && (
        <Box
          sx={{
            padding: '10px'
          }}
        >
          {balance} {isGoerli ? `Goerli${symbol}` : symbol}
        </Box>
      )}
      <Box
        sx={{
          paddingRight: '5px'
        }}
      >
        <DisplayAddress
          withAvatar
          address={address}
          truncateSize={30}
          textTransform="none"
          placement="bottom"
          fontStyle="bold"
          showAll={showAll}
        />
      </Box>
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
