'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { GearIcon, ShuffleIcon, UpdateIcon } from '@radix-ui/react-icons';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { isEmpty } from 'lodash';
import { Loader } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as z from 'zod';

import ConnectWalletButton from './connect-wallet-button';
import { SwapCard } from './swap-card';
import { TokenDetail } from './token-detail';
import { Card } from './ui/card';
import { Modal } from './ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Typography } from './ui/typography';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SwapValue } from '@/utils/enum';
import { findToken, ITokenMetadata, tokens } from '@/utils/token';
import truncate from "@/utils/truncate"

const formSchema = z.object({
  payAmount: z.any().transform((v) => Number(v) || 0),
  receiveAmount: z.any().transform((v) => Number(v) || 0),
  payBalance: z.number(),
  receiveBalance: z.number(),
  payToken: z.string(),
  receiveToken: z.string(),
  payPrice: z.number(),
  receivePrice: z.number(),
  slippage: z.number(),
})

type SwapFormValues = z.infer<typeof formSchema>;

export const SwapForm: React.FC = () => {
  const { connected, publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState<SwapValue>(SwapValue.PAY)
  const [tokenList, setTokenList] = useState<ITokenMetadata[]>(tokens)
  const [loading, setLoading] = useState(false)

  const pythConnection = new PriceServiceConnection("https://hermes.pyth.network", {
    priceFeedRequestConfig: {
      binary: true,
    },
  })

  const form = useForm<SwapFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payAmount: 0,
      receiveAmount: 0,
      payBalance: 0,
      receiveBalance: 0,
      payToken: "sol",
      receiveToken: "usdc",
      slippage: 0.3,
    },
  })

  const onSubmit = async (data: SwapFormValues) => {
    setLoading(true)
    const { payAmount, payToken, payBalance ,receiveToken, slippage } = data;
    const payTokenMetadata = findToken(payToken)
    const receiveTokenMetadata = findToken(receiveToken)

    if (payBalance === 0 || payAmount > payBalance) {
      setLoading(false)
      toast.error("Insufficient balance")
      return
    }
    if (!payTokenMetadata || !receiveTokenMetadata) {
      setLoading(false)
      return;
    }

    try {
      const quoteResponse = await axios.get("https://quote-api.jup.ag/v6/quote", {
        params: {
          // inputMint: payTokenMetadata?.addresses['solana'], mock address SOL
          inputMint: "So11111111111111111111111111111111111111112",
          // outputMint: receiveTokenMetadata?.addresses["solana"], mock address USDC
          outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: payAmount * 10 ** payTokenMetadata.decimal,
          slippageBps: slippage * 100,
        },
      })

      // Get serialized transactions for the swap
      const swapResponse = await axios.post(
        "https://quote-api.jup.ag/v6/swap",
        {
          quoteResponse: quoteResponse.data,
          userPublicKey: publicKey?.toBase58(),
          wrapAndUnwrapSol: true,
          prioritizationFeeLamports: 10000,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const { swapTransaction } = swapResponse.data

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, "base64")
      const deserializedTx = VersionedTransaction.deserialize(swapTransactionBuf)

      // Sign the transaction
      const signatures = await signTransaction?.(deserializedTx)

      // Add the signature
      if (publicKey && signatures) deserializedTx.addSignature(publicKey, signatures.signatures[0])

      // Replace the blockhash
      const bhInfo = await connection.getLatestBlockhashAndContext("finalized")
      deserializedTx.message.recentBlockhash = bhInfo.value.blockhash

      // Simulate deserializedTx
      const simulation = await connection.simulateTransaction(deserializedTx, { commitment: "processed" })
      if (simulation.value.err) {
        toast.error("Simulate failed: " + simulation.value.err.toString())
      }
      const signature = await connection.sendTransaction(deserializedTx, {
        skipPreflight: true,
        preflightCommitment: "processed",
      })
      const confirmation = await connection.confirmTransaction(signature, "finalized")
      if (confirmation.value.err) {
        toast.error("Transaction failed: " + confirmation.value.err.toString())
      }
      toast.success(`https://solscan.io/tx/${signature}`)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      toast.error("Transaction failed!")
    }
  }

  const handleFilterToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tokenList = e.target.value
    if (tokenList) {
      setTokenList(
        tokens.filter((token) => token.symbol.toLowerCase().includes(tokenList.toLowerCase())
        || token.name.toLowerCase().includes(tokenList.toLowerCase())
        || token.id.toLowerCase().includes(tokenList.toLowerCase())
        || token.addresses["solana"]?.toLowerCase().includes(tokenList.toLowerCase())
        || Object.values(token.addresses || {}).some((address) => address?.toLowerCase().includes(tokenList.toLowerCase()))
      ))
    }
  }

  const onSelectToken = (token: ITokenMetadata) => {
    if (selectedValue === SwapValue.PAY) {
      if (form.getValues()?.receiveToken === token.symbol) {
        form.setValue("receiveToken", form.getValues().payToken)
        form.setValue("payToken", token.symbol)
      } else form.setValue("payToken", token.symbol)
       onUpdatePrice("payAmount")
    } else {
      if (form.getValues()?.payToken === token.symbol) {
        form.setValue("payToken", form.getValues().receiveToken)
        form.setValue("receiveToken", token.symbol)
      } else form.setValue("receiveToken", token.symbol)
       onUpdatePrice("receiveAmount")
    }
    setIsOpen(false)
  }

  const onToggleModal = (destination: SwapValue) => {
    setIsOpen(true)
    setTokenList(tokens)
    setSelectedValue(destination)
  }

  const onSwitchAsset = () => {
    const payToken = form.getValues().payToken
    form.setValue("payToken", form.getValues().receiveToken)
    form.setValue("receiveToken", payToken)

    const payPrice = form.getValues().payAmount
    form.setValue("payAmount", form.getValues().receiveAmount)
    form.setValue("receiveAmount", payPrice)
  }

  const onUpdatePrice = async (field: string) => {
    const { payToken, receiveToken, payAmount, receiveAmount } = form.getValues()

    const payPriceId = findToken(payToken)?.priceId
    const receivePriceId = findToken(receiveToken)?.priceId

    if (!payPriceId || !receivePriceId) return

    try {
      const priceUpdates = await pythConnection.getLatestPriceFeeds([payPriceId, receivePriceId])

      if (!priceUpdates) return

      const payPrice = Number(priceUpdates[0].getPriceNoOlderThan(60)?.price)
      const receivePrice = Number(priceUpdates[1].getPriceNoOlderThan(60)?.price)

      form.setValue("payPrice", payPrice)
      form.setValue("receivePrice", receivePrice)

      if (field === "payAmount") {
        form.setValue("receiveAmount", (payAmount * payPrice) / receivePrice)
      }

      if (field === "receiveAmount") {
        form.setValue("payAmount", (receiveAmount * receivePrice) / payPrice)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} title="" description="" onClose={() => setIsOpen(false)}>
        <Input type="text" placeholder="Search for a token" disabled={false} onChange={handleFilterToken} autoFocus />
        <div className="no-scrollbar mt-2 flex sm:h-80 h-[32rem] flex-col gap-2 overflow-y-scroll px-2">
          {isEmpty(tokenList) ? (
            <>
              <Typography className="mt-8 w-full text-base text-center" level="body3">
                No token found
              </Typography>
              <Loader className="mx-auto mt-4" />
            </>
          ) : (
            tokenList.map((token) => {
              const tokenMetadata = findToken(token.symbol)
              const tokenAddress =
                tokenMetadata?.addresses["solana"] || Object.values(tokenMetadata?.addresses || {})[0] || ""

              if (!tokenMetadata || !tokenAddress) {
                return null
              }
              return (
                <div
                  key={token.id}
                  onClick={() => onSelectToken(token)}
                  className="cursor-pointer rounded-lg shadow-card hover:bg-gray-200"
                >
                  <TokenDetail token={token.symbol} />
                </div>
              )
            })
          )}
        </div>
      </Modal>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onChange={(event) => onUpdatePrice((event.target as HTMLInputElement)?.name)}
          className="flex w-full flex-col gap-3"
        >
          <div className="flex items-center justify-between rounded-2xl bg-white/60 p-2 shadow-card">
            <div
              onClick={() => form.reset()}
              className="cursor-pointer rounded-xl bg-white p-3 shadow-card hover:bg-gray-100"
            >
              <UpdateIcon />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <Typography level="body4" className='font-semibold' color="secondary">
                  Slippage
                </Typography>
                <Typography level="body4" color="secondary">
                  {form.watch("slippage")}%
                </Typography>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <div className="cursor-pointer rounded-xl bg-white p-3 shadow-card hover:bg-gray-100">
                    <GearIcon />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Card className="flex w-fit flex-col bg-white p-2">
                    <Typography level="body4" className="font-semibold" color="secondary">
                      Trade slippage
                    </Typography>
                    <Typography level="body5" className="max-w-[18rem] break-normal" color="secondary">
                      Set the allowed price difference percentage for your trade.
                    </Typography>
                    <FormField
                      control={form.control}
                      name={"slippage"}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              type="number"
                              className="mt-2"
                              placeholder="0.3"
                              min={0}
                              max={50}
                              step={0.1}
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  Number.isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </Card>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="rounded-2xl bg-white/60 p-6 shadow-card">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <Typography level="body4" color="secondary">
                  Wallet address
                </Typography>
                <Typography level="body4" className="font-semibold">
                  {publicKey ? truncate(publicKey.toBase58(), 16, true) : "0x"}
                </Typography>
              </div>

              <div className="relative space-y-6">
                <SwapCard destination={SwapValue.PAY} onToggleModal={onToggleModal} form={form} />
                <div
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-8 cursor-pointer rounded-md bg-primary-400/70 p-3 hover:scale-110"
                  onClick={onSwitchAsset}
                >
                  <ShuffleIcon className="font-semibold text-white" />
                </div>
                <SwapCard destination={SwapValue.RECEIVER} onToggleModal={onToggleModal} form={form} />
              </div>

              {connected ? (
                <Button
                  loading={loading}
                  disabled={form.watch("payAmount") <= 0 || form.watch("receiveAmount") <= 0}
                  type="submit"
                >
                  Swap
                </Button>
              ) : (
                <ConnectWalletButton />
              )}
            </div>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white/90 p-2 shadow-card">
            <TokenDetail token={form.watch("payToken")} />
            <TokenDetail token={form.watch("receiveToken")} />
          </div>
        </form>
      </Form>
    </>
  )
}
