import { PriceData } from "../types/interface";

export class Datasource {
	private url: string;

	constructor(url: string) {
		this.url = url;
	}

	async getPrices(): Promise<Record<string, number>> {
		try {
			const response = await fetch(this.url);
			if (!response.ok) {
				throw new Error('Failed to fetch prices');
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
			throw error;
		}
	}
}