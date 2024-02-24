const stripNonDigits = <T>(value: T) =>
  typeof value === 'string' ? value.replace(/\D+/g, '') || '0' : value

export default stripNonDigits
