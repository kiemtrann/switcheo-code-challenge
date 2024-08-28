import { Blockchain } from "./enum";

export interface WalletBalance {
	currency: string;
	amount: number;
	blockchain: Blockchain;
}

export interface PriceData {
	currency: string;
	date: string;
	price: number;
}
