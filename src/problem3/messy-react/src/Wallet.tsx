import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { WalletBalance } from './types/interface';
import { getPriority } from './utils/priority';
import { Datasource } from './services/Datasource';
import { useWalletBalances } from './hooks/useWalletBalances';
import { WalletRow } from './components/WalletRow';

function WalletPage() {
  const balances = useWalletBalances()
  const [prices, setPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    const datasource = new Datasource("https://interview.switcheo.com/prices.json")
    datasource
      .getPrices()
      .then((prices) => {
        setPrices(prices)
      })
      .catch((error) => {
        console.error("Error fetching prices:", error)
      })
  }, [])

  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        return balance.amount >= 0
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain)
        const rightPriority = getPriority(rhs.blockchain)
        return rightPriority - leftPriority
      })
  }, [balances])

  const rows = sortedBalances.map((balance: WalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount
    return (
      <WalletRow
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
      />
    )
  })

  return <div>{rows}</div>;
}

export default WalletPage;
