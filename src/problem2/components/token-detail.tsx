import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { CopyIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from "react-hot-toast"
import { findToken } from '@/utils/token';
import { Typography } from './ui/typography';


interface TokenDetailProps {
  token: string
}

export const TokenDetail = ({ token }: TokenDetailProps) => {
  const [tokenPrice, setTokenPrice] = useState(0)
  const pythConnection = new PriceServiceConnection("https://hermes.pyth.network", {
    priceFeedRequestConfig: {
      binary: true,
    },
  })

  const tokenMetadata = findToken(token)

  const fetchPriceUpdates = async () => {
    if (tokenMetadata?.priceId) {
      const priceUpdates = await pythConnection.getLatestPriceFeeds([tokenMetadata?.priceId || ""])
      setTokenPrice(Number(priceUpdates?.[0].getPriceNoOlderThan(60)?.price))
    }
  }

  useEffect(() => {
    fetchPriceUpdates()
  }, [tokenMetadata])

  const tokenAddress = tokenMetadata?.addresses["solana"] || Object.values(tokenMetadata?.addresses || {})[0] || ""

  if (!tokenMetadata || !tokenAddress) {
    return null
  }

  return (
    <div className="flex w-full items-center justify-between p-2">
      <div className="flex items-center sm:gap-4 gap-2">
        <Image
          priority
          src={`/icons/tokens/${token.toLocaleUpperCase()}.svg`}
          alt="token-logo"
          width={40}
          height={40}
        />
        <div className="flex w-16 flex-col items-start justify-center">
          <Typography className='sm:text-base text-xs' level="body3" color="secondary">
            {tokenMetadata.symbol.toUpperCase()}
          </Typography>
          <Typography level="body4" color="secondary">
            {tokenMetadata.name}
          </Typography>
        </div>

        <div
          className="flex cursor-pointer sm:w-40 w-32 items-center justify-center gap-2 rounded-lg bg-cyan-600/30 px-2"
          onClick={() => {
            navigator.clipboard.writeText(tokenAddress)
            toast.success("Copied!")
          }}
        >
          <Typography level="body4" color="secondary">
            {tokenAddress.slice(0, 5)}...
            {tokenAddress.slice(-5)}
          </Typography>
          <CopyIcon accentHeight={2} />
        </div>

        <ExternalLinkIcon
          className="cursor-pointer"
          onClick={() => window.open(`https://solana.fm/address/${tokenAddress}/transactions?cluster=mainnet-alpha`)}
        />
      </div>

      <Typography level="body4" color="secondary">
        ${(tokenPrice / 10 ** 8).toFixed(2)}
      </Typography>
    </div>
  )
}
