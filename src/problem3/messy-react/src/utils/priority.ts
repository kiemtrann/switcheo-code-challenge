import { Blockchain } from "../types/enum";

export const priorityMap: Record<Blockchain, number> = {
	[Blockchain.Osmosis]: 100,
	[Blockchain.Ethereum]: 50,
	[Blockchain.Arbitrum]: 30,
	[Blockchain.Zilliqa]: 20,
	[Blockchain.Neo]: 20,
};

export const getPriority = (blockchain: Blockchain): number => {
	return priorityMap[blockchain];
};