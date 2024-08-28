# Problem 3: Messy React

<aside>
⏰ Duration: You should not spend more than 6 **hours** on this problem.
*Time estimation is for internship roles, if you are a software professional you should spend significantly less time.*

</aside>

# Task

List out the computational inefficiencies and anti-patterns found in the code block below.

1. This code block uses
    1. ReactJS with TypeScript.
    2. Functional components.
    3. React Hooks
2. Implement the Datasource class so that it can retrieve the prices required.
3. You should explicitly state the issues and explain how to improve them.
4. You should also provide a refactored version of the code.

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
}
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}

class Datasource {
  // TODO: Implement datasource class
}

interface Props extends BoxProps {

}
const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
	const [prices, setPrices] = useState({});

  useEffect(() => {
    const datasource = new Datasource("https://interview.switcheo.com/prices.json");
    datasource.getPrices().then(prices => {
      setPrices(prices);
    }).catch(error => {
      console.err(error);
    });
  }, []);

	const getPriority = (blockchain: any): number => {
	  switch (blockchain) {
	    case 'Osmosis':
	      return 100
	    case 'Ethereum':
	      return 50
	    case 'Arbitrum':
	      return 30
	    case 'Zilliqa':
	      return 20
	    case 'Neo':
	      return 20
	    default:
	      return -99
	  }
	}

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
		  const balancePriority = getPriority(balance.blockchain);
		  if (lhsPriority > -99) {
		     if (balance.amount <= 0) {
		       return true;
		     }
		  }
		  return false
		}).sort((lhs: WalletBalance, rhs: WalletBalance) => {
			const leftPriority = getPriority(lhs.blockchain);
		  const rightPriority = getPriority(rhs.blockchain);
		  if (leftPriority > rightPriority) {
		    return -1;
		  } else if (rightPriority > leftPriority) {
		    return 1;
		  }
    });
  }, [balances, prices]);

  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed()
    }
  })

  const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      <WalletRow 
        className={classes.row}
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    )
  })

  return (
    <div {...rest}>
      {rows}
    </div>
  )
}
```

I. The computational inefficiencies and anti-patterns

1. Reuse the interface

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;   
}
```

The `FormattedWalletBalance` interface extends the `WalletBalance` interface, ensuring that it has all the properties of the original interface plus the `formatted` property.

1. Switch case statements

```tsx
enum Blockchain {
  Osmosis = 'Osmosis',
  Ethereum = 'Ethereum',
  Arbitrum = 'Arbitrum',
  Zilliqa = 'Zilliqa',
  Neo = 'Neo',
}

const priorityMap: Record<Blockchain, number> = {
  [Blockchain.Osmosis]: 100,
  [Blockchain.Ethereum]: 50,
  [Blockchain.Arbitrum]: 30,
  [Blockchain.Zilliqa]: 20,
  [Blockchain.Neo]: 20,
};

const getPriority = (blockchain: Blockchain): number => {
  return priorityMap[blockchain] ?? -99;
};
```

- **Enum definition:** The `Blockchain` enum defines a set of possible blockchain names. This ensures type safety and prevents typos or invalid values.
- **Switch statement:** While switch statements are generally efficient for comparing a single value against multiple cases, they can become less efficient as the number of cases grows. In this particular case, the number of cases is relatively small, so the performance impact is likely minimal. However, for a large number of cases, consider using a lookup table or a map for faster comparisons.
- **Magic numbers:** The use of hardcoded numbers (like `100`, `50`, `30`, etc.) in the switch statement is a common anti-pattern known as "magic numbers." These numbers lack context and can make the code harder to understand and maintain.
1. Inefficiencies of filter and sort

```tsx
const sortedBalances = useMemo(() => {
  return balances
    .filter((balance: WalletBalance) => {
      const priority = getPriority(balance.blockchain);
      return priority > -99 && balance.amount > 0;
    })
    .sort((lhs: WalletBalance, rhs: WalletBalance) => {
      const leftPriority = getPriority(lhs.blockchain);
      const rightPriority = getPriority(rhs.blockchain);   

      return rightPriority - leftPriority;
    });
}, [balances, prices]);
```

**Inefficiencies:**

- **Nested `if` statements:** The nested `if` statements within the `filter` function can be simplified using a single conditional expression. This can improve readability and potentially reduce the number of evaluations.

**Anti-patterns:**

- **Negation of conditions:** The `filter` function uses a negation to determine if a balance should be included. This can make the code harder to read and understand
1. Spaghetti code:

```tsx
  const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount
    return (
      <WalletRow
        className={classes.row}
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
        // formattedAmount={balance.formatted} don't need to provide the formattedAmount ouside of component
      />
    )
  })
```

- There's no need to create a separate `formattedBalances` array. This simplifies the code and avoids unnecessary processing. By removing the unnecessary `map`, interface and object creation, we can improve the performance and conciseness of the code.

```tsx
// Remove this interface
interface FormattedWalletBalance {
  currency: string
  amount: number
  formatted: string
}

// Remove this map
 const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed(),
    }
 })
```

1. Implement datasource class

```tsx
interface PriceData {
  currency: string;
  date: string;
  price: number;
}

class Datasource {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

 async getPrices(): Promise<Record<string, number>> {
    try {
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }
      const data: PriceData[] = await response.json();

      // Convert the array of price data to a dictionary for easier lookup
      const prices: Record<string, number> = {};
      data.forEach((item) => {
        prices[item.currency] = item.price;
      });

      return prices;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error; // Re-throw the error for handling in useEffect
    }
  }
}

const [prices, setPrices] = useState<Record<string, number>>({})

useEffect(() => {
  const datasource = new Datasource("https://interview.switcheo.com/prices.json");
  datasource
    .getPrices()
    .then((prices) => {
      setPrices(prices);
    })
    .catch((error)   
 => {
      // Handle error here, e.g., display an error message
      console.error("Error fetching prices:", error);
    });
}, []);
```

II. A refactored version of the code:

```tsx
interface WalletBalance {
  currency: string
  amount: number
  blockchain: Blockchain
}

interface PriceData {
  currency: string
  date: string
  price: number
}

interface Props extends BoxProps {}

enum Blockchain {
  Osmosis = "Osmosis",
  Ethereum = "Ethereum",
  Arbitrum = "Arbitrum",
  Zilliqa = "Zilliqa",
  Neo = "Neo",
}

const priorityMap: Record<Blockchain, number> = {
  [Blockchain.Osmosis]: 100,
  [Blockchain.Ethereum]: 50,
  [Blockchain.Arbitrum]: 30,
  [Blockchain.Zilliqa]: 20,
  [Blockchain.Neo]: 20,
}

class Datasource {
  private url: string

  constructor(url: string) {
    this.url = url
  }

  async getPrices(): Promise<Record<string, number>> {
    try {
      const response = await fetch(this.url)
      if (!response.ok) {
        throw new Error("Failed to fetch prices")
      }
      const data: PriceData[] = await response.json()

      // Convert the array of price data to a dictionary for easier lookup
      const prices: Record<string, number> = {}
      data.forEach((item) => {
        prices[item.currency] = item.price
      })

      return prices
    } catch (error) {
      console.error("Error fetching prices:", error)
      throw error
    }
  }
}

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props
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

  const getPriority = (blockchain: Blockchain): number => {
    return priorityMap[blockchain] ?? -99
  }

  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const priority = getPriority(balance.blockchain)
        return priority > -99 && balance.amount > 0
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain)
        const rightPriority = getPriority(rhs.blockchain)
        return rightPriority - leftPriority
      })
  }, [balances, prices])

  const rows = sortedBalances.map((balance: WalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount
    return (
      <WalletRow
        className={classes.row}
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
      />
    )
  })

  return <div {...rest}>{rows}</div>
}

```