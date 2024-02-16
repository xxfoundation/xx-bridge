import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { u8aToHex } from '@polkadot/util'
import { padHex, toHex } from 'viem'

export interface Network {
  name: string
  gasToken: {
    code: string
    symbol: string
  }
  token?: {
    address: string
    code: string
    symbol: string
    decimals: number
  }
}

// Check if an address is a valid xx network address
export const isValidXXNetworkAddress = (address: string) => {
  // Quit early if hex string
  if (address.startsWith('0x')) {
    return false
  }
  try {
    // Use ss58 format 55, which is registered for xx network
    const val = decodeAddress(address, false, 55)
    const addr = encodeAddress(val, 55)
    return addr.length === 48
  } catch (error) {
    return false
  }
}

// Convert ss58 address to hexstring pubkey
export const convertXXAddress = (address: string) => {
  const val = decodeAddress(address, false)
  return u8aToHex(val)
}

export const encodeBridgeDeposit = (
  to: string,
  amount: bigint
): `0x${string}` => {
  const deposit = padHex(toHex(amount)).substring(2) // Deposit Amount (32 bytes)
  const recipientLen = padHex(toHex((to.length - 2) / 2)).substring(2) // len(recipientAddress) (32 bytes)
  const recipient = to.substring(2) // recipientAddress (?? bytes)
  return `0x${deposit}${recipientLen}${recipient}`
}

const camelToKebabCase = (str: string): string =>
  `--${str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`

/*
Usage:

# Example.tsx
import './styles.scss';
import { createStyleVariables } from './utils';
(...)
const drawerWidth = '240px';
const drawerWidthMobile = '100%';
const style = createStyleVariables({ drawerWidth, drawerWidthMobile })
return (
    <div style={style} className={'main-body'}>
        Something
    </div>
)

# styles.scss
.main-body {
    width: var(--drawer-width);
    @media (max-width: 768px) {
        width: var(--drawer-width-mobile);
    }
}
*/

export const createStyleVariables = (cssPropertyValue: object) => {
  if (cssPropertyValue === undefined) return {}
  return Object.entries(cssPropertyValue)
    .map((cssProperty: string[]) => {
      const key = cssProperty[0]
      const value = cssProperty[1] as string
      const name = camelToKebabCase(key)
      const style = { [name]: value }
      console.log(style)
      return style
    })
    .reduce((acc, cur) => ({ ...acc, ...cur }), {})
}

export const shortenHash = (hash: string, size: number = 4): string =>
  `${hash.slice(0, 2 + size)}...${hash.slice(-size)}`

// truncate string to a certain length and add ellipsis if longer than length
export const truncateString = (str: string, length: number = 15): string =>
  str.length > length ? `${str.substring(0, length)}...` : str

// convert timestamp to HH:MM:SS format from user's timezone
export const formatTimestampHour = (
  timestamp: Date | number | string,
  withSeconds = false
): string => {
  // return 'now' if timestamp is within 1 minute of current time
  const now = Date.now()
  if (now - Number(timestamp) < 60000) {
    return 'now'
  }
  // return 'X minutes ago' if timestamp is within 1 hour of current time
  const minutesAgo = Math.floor((now - Number(timestamp)) / 60000)
  if (minutesAgo < 60) {
    return `${minutesAgo} minutes ago`
  }

  const date = new Date(timestamp)
  // getHours, getMinutes, getSeconds return values in local timezone
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  // padding with 0s
  const hoursStr = hours.toString().padStart(2, '0')
  const minutesStr = minutes.toString().padStart(2, '0')
  const secondsStr = seconds.toString().padStart(2, '0')
  return withSeconds
    ? `${hoursStr}:${minutesStr}:${secondsStr}`
    : `${hoursStr}:${minutesStr}`
}

export function checkForUndefinedVariables<T extends any[]>(
  fileName: string,
  variables: T
): asserts variables is { [K in keyof T]: NonNullable<T[K]> } {
  variables.forEach((variable, index) => {
    if (variable === undefined || variable === null) {
      throw new Error(
        `[ERROR]: ${fileName} > Argument at position ${index} is undefined or null`
      )
    }
  })
}

// isAddress
export const isETHAddress = (address: string): boolean =>
  address.startsWith('0x') && address.length === 42
