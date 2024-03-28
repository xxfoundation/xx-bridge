import { Tooltip, Typography } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useEnsName } from 'wagmi'
import { Stack, TypographyProps } from '@mui/system'
import { Block, Check, CopyAll } from '@mui/icons-material'
import { shortenHash, truncateString } from '@/utils'
import WrappedIcon from './WrappedIcon'
import DisplayAvatar from './DisplayAvatar'

export const placeholderAddressDisplay = 'Unknown Address'

interface DisplayAddressProps extends TypographyProps {
  notComponent?: boolean
  address: string | undefined
  withAvatar?: boolean
  showAll?: boolean
  label?: boolean
  truncateSize?: number
  nickname?: string
  tooltip?: boolean
  blocked?: boolean
  placement?: 'top' | 'bottom' | 'left' | 'right'
  copy?: boolean
}

const DisplayAddress: React.FC<DisplayAddressProps> | string = ({
  notComponent = false,
  address,
  withAvatar = false,
  showAll = false,
  label = false,
  truncateSize = 20,
  tooltip = false,
  blocked,
  placement = 'right',
  copy = false,
  ...props
}) => {
  const ensName = useEnsName({
    address: address as `0x${string}`,
    chainId: 1
  }).data

  const [copied, setCopied] = useState<boolean>(false)
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
    return () => {}
  }, [copied])

  const processStr = (str: string) =>
    showAll ? str : truncateString(str, truncateSize)

  const processAddr = (addr: string | undefined) => {
    if (addr === placeholderAddressDisplay || !addr) {
      return placeholderAddressDisplay
    }
    return showAll ? addr : shortenHash(addr)
  }

  const displayAddress = useMemo(() => {
    if (ensName) {
      return processStr(label ? ensName : processStr(ensName))
    }
    if (!ensName) {
      return processAddr(address)
    }
    return processAddr(address)
  }, [label, ensName, address])

  const displayValue = useMemo(
    () => (
      <Stack direction="row" spacing={1} justifyContent="center">
        <Typography
          variant="body1"
          fontFamily={ensName ? 'inherit' : 'monospace'}
          {...props}
        >
          {displayAddress}
        </Typography>
        {blocked && <Block fontSize="small" />}
      </Stack>
    ),
    [displayAddress, props, ensName, label]
  )

  if (notComponent) {
    return displayAddress
  }

  return (
    <>
      <Stack
        direction="row"
        spacing="10px"
        alignItems="center"
        justifyContent="flex-start"
      >
        {withAvatar && address && (
          <DisplayAvatar address={address} size="small" />
        )}
        {tooltip ? (
          <Tooltip title={address} placement={placement}>
            {displayValue}
          </Tooltip>
        ) : (
          displayValue
        )}
        {copy &&
          (copied ? (
            <Check fontSize="small" />
          ) : (
            <WrappedIcon
              icon={<CopyAll />}
              onClick={() => {
                navigator.clipboard.writeText(address as string)
                setCopied(true)
              }}
            />
          ))}
      </Stack>
    </>
  )
}

export default DisplayAddress
