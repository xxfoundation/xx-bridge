import { Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import { useEnsName } from 'wagmi'
import { shortenHash, truncateString } from '@/utils'

export const placeholderAddressDisplay = 'Unknown Address'

interface DisplayAddressProps {
  address: string | undefined
  showAll?: boolean
  preferAddressOverName?: boolean
  truncateSize?: number
  nickname?: string
  noTooltip?: boolean
}

const DisplayAddress: React.FC<DisplayAddressProps> = ({
  address,
  showAll = false,
  preferAddressOverName = false,
  truncateSize = 15,
  nickname = '',
  noTooltip = false
}) => {
  const ensName = useEnsName({ address: address as `0x${string}` }).data

  const displayAddress = useMemo(() => {
    if (nickname) {
      return showAll ? nickname : truncateString(nickname, truncateSize)
    }
    if (ensName) {
      return showAll ? ensName : truncateString(ensName, truncateSize)
    }
    if (address === placeholderAddressDisplay || !address) {
      return placeholderAddressDisplay
    }
    return showAll ? address : shortenHash(address)
  }, [nickname, ensName, address])

  const displayPreferedAddress = useMemo(() => {
    if (nickname && ensName) {
      return showAll ? ensName : truncateString(ensName, truncateSize)
    }
    if (!nickname && !ensName) {
      return ''
    }
    if (address === placeholderAddressDisplay || !address) {
      return placeholderAddressDisplay
    }
    return showAll ? address : shortenHash(address)
  }, [nickname, ensName, address])

  return noTooltip ? (
    <Typography
      variant="body1"
      fontWeight="bold"
      fontFamily={ensName ? 'inherit' : 'monospace'}
    >
      {preferAddressOverName ? displayPreferedAddress : displayAddress}
    </Typography>
  ) : (
    <Tooltip title={address} placement="right">
      <Typography
        variant="body1"
        fontWeight="bold"
        fontFamily={ensName ? 'inherit' : 'monospace'}
      >
        {preferAddressOverName ? displayPreferedAddress : displayAddress}
      </Typography>
    </Tooltip>
  )
}

export default DisplayAddress
