import React from 'react';

interface WalletRowProps {
	amount: number;
	usdValue: number;
	className?: string;
}

export const WalletRow: React.FC<WalletRowProps> = ({
	amount,
	usdValue,
	className,
}) => {
	return (
		<div className={className}>
			<span>{amount}</span>
			<span>{usdValue.toFixed(2)}</span>
		</div>
	);
};
