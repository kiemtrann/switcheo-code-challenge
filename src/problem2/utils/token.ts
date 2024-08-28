import _tokens from "../data/tokens.json"

export interface ITokenMetadata {
  id: string
  symbol: string
  name: string
  marketCapRank: number | null
  addresses: { [key: string]: string | undefined }
  priceId?: string
  decimal: number
}

export const tokens: ITokenMetadata[] = _tokens

export const findToken = (symbol?: string, address?: string, network?: string): ITokenMetadata | undefined => {
  if (symbol) {
    return tokens.find((token) => token.symbol.toLowerCase() === symbol.toLowerCase())
  } else if (address && network) {
    return tokens.find((token) => token.addresses[network]?.toLowerCase() === address.toLowerCase())
  }
  return undefined
}
