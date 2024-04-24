import React, { useMemo } from 'react'
import { useEnsAvatar, useEnsName } from 'wagmi'
import { normalize } from 'viem/ens'
import { Avatar } from '@mui/material'
import defaultAvatar from '@/assets/avatar/user.svg'
import { NetworkLogo } from './Wallets/Utils'
import { ethereumMainnet } from '@/consts'

interface DisplayAvatarProps {
  address: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
}

const DisplayAvatar: React.FC<DisplayAvatarProps> = ({
  size = 'small',
  address,
  ...props
}) => {
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 1
  })
  const ensAvatar = useEnsAvatar({
    name: normalize(ensName as string),
    chainId: 1
  }).data

  const avatarSize = useMemo(() => {
    switch (size) {
      case 'tiny':
        return '25px'
      case 'small':
        return '48px'
      case 'medium':
        return '80px'
      case 'large':
        return '150px'
      default:
        return '40px'
    }
  }, [size])
  const avatarImg = useMemo(
    () => (
      <img
        src={ensAvatar || defaultAvatar}
        alt="avatar"
        style={{ height: avatarSize, width: avatarSize, borderRadius: '50%' }}
      />
    ),
    [ensAvatar]
  )

  return (
    <>
      {ensAvatar ? (
        <Avatar
          {...props}
          style={{
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {avatarImg}
        </Avatar>
      ) : (
        <NetworkLogo network={ethereumMainnet} textSize />
      )}
    </>
  )
}

export default DisplayAvatar
