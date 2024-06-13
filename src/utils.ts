import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { u8aToHex } from '@polkadot/util'
import { padHex, toHex } from 'viem'
import axios, { AxiosError } from 'axios'

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

/**
 * Formats a number to a string with a suffix
 * @param {number} value - The first number.
 * @returns {string} - The converted value into string.
 * @example const value = 1000
 * const result = formatValueToSuffix(value)
 * console.log(result) // 1K
 */
const formatValueToSuffix = (
  value: number,
  maxDigits: number = 4,
  decimalDigits: number = 2
) => {
  const formatNumber = (num: number, forceDecimal: boolean) => {
    let numStr = num.toFixed(forceDecimal ? decimalDigits : 0)
    const [intPart, decPart] = numStr.split('.')
    if (intPart.length > maxDigits) {
      // If integer part is longer than maxDigits, truncate and use decimal part
      const requiredIntDigits = Math.min(intPart.length, maxDigits)
      const formattedIntPart = intPart.substring(0, requiredIntDigits)
      const formattedDecPart = decPart
        ? decPart.substring(0, decimalDigits)
        : ''
      numStr =
        formattedIntPart + (formattedDecPart ? `.${formattedDecPart}` : '')
    }

    return numStr
  }

  // Less than 1000, just return the number
  if (value < 1000) return formatNumber(value, true)

  // Thousands
  if (value < 1000000) {
    // Check if the integer part of value is longer than maxDigits
    if (Math.floor(value).toString().length > maxDigits) {
      return `${formatNumber(value / 1000, true)}K`
    }

    // Check if the integer part of kValue is longer than maxDigits
    if (Math.floor(value / 1000).toString().length > maxDigits) {
      return `${formatNumber(value / 1000, true)}K`
    }

    // Integer part is not longer than maxDigits so display entire value
    return `${formatNumber(value, true)}`
  }

  // Millions
  // Check if the integer part of value is longer than maxDigits
  if (Math.floor(value).toString().length > maxDigits) {
    return `${formatNumber(value / 1000000, true)}M`
  }

  // Check if the integer part of kValue is longer than maxDigits
  if (Math.floor(value / 1000000).toString().length > maxDigits) {
    return `${formatNumber(value / 1000000, true)}M`
  }

  // Integer part is not longer than maxDigits so display entire value
  return `${formatNumber(value, true)}M`
}

export const formatBalance = (
  balance: bigint | string,
  networkDecimals: number,
  decimals: number = 2
): string =>
  formatValueToSuffix(
    parseFloat(balance.toString()) * 10 ** (-1 * networkDecimals),
    4,
    decimals
  )

// Check if an address is a valid xx network address
export const isValidXXNetworkAddress = (address: string) => {
  // Quit early if hex string
  if (address.startsWith('0x')) {
    return false
  }
  // Quit early if not valid lenght
  if (address.length !== 48) {
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

// Convert hexstring pubkey to ss58 address
export const convertXXPubkey = (pubkey: string) => {
  const address = encodeAddress(pubkey, 55)
  return address
}

export const encodeBridgeDeposit = (
  to: string,
  amount: bigint
): `0x${string}` => {
  if (amount < BigInt(0)) {
    console.error('Amount must be greater than 0')
    return '0x'
  }
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

type NestedObject = {
  [key: string]: any
}

export const updateNestedKeyImmutable = (
  obj: NestedObject,
  path: string[],
  newValue: any
): NestedObject => {
  if (path.length === 0) {
    return obj
  }

  // Ensure immutability by copying the object
  const newObj = { ...obj }
  const [firstKey, ...remainingPath] = path

  if (remainingPath.length === 0) {
    newObj[firstKey] = newValue
  } else {
    // Recursively update or initialize nested objects
    newObj[firstKey] = updateNestedKeyImmutable(
      newObj[firstKey] ?? {}, // Use an empty object if the next key does not exist
      remainingPath,
      newValue
    )
  }

  return newObj
}

export const debounce = (
  fn: (...args: any[]) => void,
  delay: number | undefined
) => {
  let timeoutId: string | number | NodeJS.Timeout | undefined
  const retval = (...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
  return retval
}

// USD values for ETH and XX

type JSONData = {
  market_data: {
    current_price: {
      usd: string
    }
  }
}

export const getMarketvalue = async (
  coin: string
): Promise<string | undefined> => {
  try {
    const { data, status } = await axios.get<JSONData>(
      `https://api.coingecko.com/api/v3/coins/${coin}/`,
      {
        headers: {
          Accept: 'application/json'
        }
      }
    )

    let coinValue = 'error'
    if (status === 200) {
      coinValue = JSON.stringify(data.market_data.current_price.usd)
    }
    return coinValue
  } catch (err) {
    const error = err as Error | AxiosError
    if (axios.isAxiosError(error)) {
      console.warn(`error getting ${coin} market value: ${error.message}`)
      return undefined
    }
    console.warn(`unexpected error getting ${coin} market value: ${error}`)
    return undefined
  }
}
