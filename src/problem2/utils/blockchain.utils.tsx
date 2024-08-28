import * as splToken from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

export const isValidSolMintAddress = async (mintAddress: string) => {
  try {
    const solanaConnection = new web3.Connection("https://api.devnet.solana.com", "finalized")
    const mintPubKey = new web3.PublicKey(mintAddress);

    const info = await solanaConnection.getParsedAccountInfo(mintPubKey);

    if (!info) return false;

    const data = info.value?.data as any;

    if (!data) return false;
    return data?.parsed?.type;
  } catch (error) {
    return false;
  }
};

export const getSolBalance = async (pubKey: PublicKey) => {
  if (!pubKey) return 0

  try {
    const connection = new web3.Connection("https://api.devnet.solana.com", "finalized")

    const balance = await connection.getBalance(pubKey)
    return balance / web3.LAMPORTS_PER_SOL
  } catch (error) {
    return 0
  }
}

export const getSolanaTokenBalance = async (pubKey: PublicKey, tokenContractAddress: string) => {
  if (!pubKey || !isValidSolMintAddress(tokenContractAddress)) return 0

  try {
    const solanaConnection = new web3.Connection("https://api.devnet.solana.com", "finalized")

    const mintPubKey = new web3.PublicKey(tokenContractAddress)
    const tokenAccount = await web3.PublicKey.findProgramAddressSync(
      [pubKey.toBuffer(), splToken.TOKEN_PROGRAM_ID.toBuffer(), mintPubKey.toBuffer()],
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const tokenAmountInfo = await solanaConnection.getTokenAccountBalance(tokenAccount[0], "confirmed")

    const tokenAmount = tokenAmountInfo.value.uiAmount || 0

    return tokenAmount
  } catch (error) {
    return 0
  }
}