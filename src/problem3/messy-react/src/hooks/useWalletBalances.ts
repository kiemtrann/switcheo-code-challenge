import { useState, useEffect } from 'react';
import { WalletBalance } from '../types/interface';
import { Blockchain } from '../types/enum';

export const useWalletBalances = (): WalletBalance[] => {
	const [balances, setBalances] = useState<WalletBalance[]>([]);

	useEffect(() => {
		// Example data fetching
		setBalances([
			{ currency: 'USD', amount: 100, blockchain: Blockchain.Ethereum },
			{ currency: 'BTC', amount: 0.5, blockchain: Blockchain.Arbitrum },
		]);
	}, []);

	return balances;
};
