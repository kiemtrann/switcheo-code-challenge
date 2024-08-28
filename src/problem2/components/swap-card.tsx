import { useWallet } from "@solana/wallet-adapter-react"
import { WalletIcon } from "lucide-react"
import Image from "next/image"
import { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import { twJoin } from "tailwind-merge"
import { FormControl, FormField, FormItem, FormMessage } from "./ui/form"
import { Typography } from "./ui/typography"
import { getSolanaTokenBalance, getSolBalance } from "@/utils/blockchain.utils"
import { SwapValue } from "@/utils/enum"
import { findToken } from "@/utils/token"

interface SwapCardProps {
  destination: SwapValue
  onToggleModal: (destination: SwapValue) => void
  form: UseFormReturn<{
    payAmount: number
    receiveAmount: number
    payBalance: number
    receiveBalance: number
    payToken: string
    receiveToken: string
    payPrice: number
    receivePrice: number
    slippage: number
  }>
}

export const SwapCard = ({ destination ,onToggleModal, form }: SwapCardProps) => {
  const { publicKey } = useWallet()
  const swapTokenType = destination === SwapValue.PAY ? "payToken" : "receiveToken"
  const swapBalanceType = destination === SwapValue.PAY ? "payBalance" : "receiveBalance"

  const getBalance = async () => {
    if (!publicKey) return

    const currentToken = form.watch(swapTokenType)
    const tokenMetadata = findToken(currentToken)

    if (tokenMetadata?.symbol === "sol") {
      const solBalance = await getSolBalance(publicKey)
      form.setValue(swapBalanceType, solBalance)
    } else {
      const splTokenBalance = await getSolanaTokenBalance(
        publicKey,
        tokenMetadata?.addresses['solana'] as string
      )
       form.setValue(swapBalanceType, splTokenBalance)
    }
  }
  
  useEffect(() => {
    getBalance()
  }, [form.watch(swapTokenType), publicKey])
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-orange-600/10 p-4 shadow-card">
      <div className="flex items-center justify-between">
        <Typography level="body3" color="secondary" className="font-semibold">
          {destination}
        </Typography>
      </div>

      <div className="flex items-center">
        <FormField
          control={form.control}
          name={destination === SwapValue.PAY ? "payAmount" : "receiveAmount"}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <NumericFormat
                  thousandSeparator
                  allowNegative={false}
                  decimalScale={6}
                  className={twJoin("bg-inherit", "focus-visible:outline-none", "font-inter text-lg font-semibold")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div
          className="flex h-10 w-36 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary-400/70"
          onClick={() => onToggleModal(destination)}
        >
          <Image
            priority
            src={`/icons/tokens/${form.watch(swapTokenType).toUpperCase() || "USDC"}.svg`}
            alt="token-logo"
            width={28}
            height={28}
          />
          <Typography level="body2" className="font-bold text-white">
            {form.watch(swapTokenType).toUpperCase() || "USDC"}
          </Typography>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Typography level="body4" color="secondary" className="">
          $
          {destination === SwapValue.PAY
            ? ((form.watch("payPrice") / 10 ** 8) * form.watch("payAmount") || 0).toFixed(2)
            : ((form.watch("receivePrice") / 10 ** 8) * form.watch("receiveAmount") || 0).toFixed(2)}
        </Typography>

        <div className="flex items-center gap-2">
          <WalletIcon height={16} width={16} />
          <Typography level="body4">
            {`${form.watch(swapBalanceType)?.toFixed(2)} ${form.watch(swapTokenType).toUpperCase() || "USDC"}`}
          </Typography>
        </div>
      </div>
    </div>
  )
}
