import { supabase } from './supabase';

interface PrivyWallet {
  type: string;
  address: string;
  chain_type: string;
}

export const getChainIdFromPrivyChainId = (chainId: string): number => {
  // Convert Privy's chain_id format "eip155:1" to number 1
  const [_, id] = chainId.split(':');
  return parseInt(id);
};

export const storeWalletAddress = async (userId: string, wallet: PrivyWallet) => {
  try {
    console.log('Attempting to store wallet:', { userId, wallet });

    // Validate required data
    if (!userId || !wallet?.address || !wallet?.chain_type) {
      const missingFields = [];
      if (!userId) missingFields.push('userId');
      if (!wallet?.address) missingFields.push('address');
      if (!wallet?.chain_type) missingFields.push('chain_type');
      
      throw new Error(`Missing required wallet data: ${missingFields.join(', ')}`);
    }

    // Store new wallet with validation
    const { data, error } = await supabase
      .from('wallet_addresses')
      .insert({
        user_id: userId,
        blockchain: wallet.chain_type.toLowerCase(),
        address: wallet.address.toLowerCase(),
        verified: true,
        verification_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // If duplicate, just return existing wallet
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('wallet_addresses')
          .select('*')
          .match({
            user_id: userId,
            address: wallet.address.toLowerCase()
          })
          .single();
        return existing;
      }
      throw error;
    }

    console.log('Successfully stored wallet:', data);
    return data;
  } catch (error) {
    console.error('Error storing wallet address:', error);
    throw error;
  }
};

// Only used during initial onboarding
export const storeInitialWallet = async (userId: string, wallet: PrivyWallet) => {
  try {
    // First check if wallet exists
    const { data: existing } = await supabase
      .from('wallet_addresses')
      .select('id')
      .match({
        user_id: userId,
        address: wallet.address.toLowerCase()
      })
      .single();

    if (existing) {
      return null; // Wallet already exists
    }

    return await storeWalletAddress(userId, wallet);
  } catch (error) {
    console.error('Error storing initial wallet:', error);
    throw error;
  }
};

export const storeAllLinkedWallets = async (authId: string, linkedAccounts: PrivyWallet[]) => {
  const wallets = linkedAccounts.filter(account => account.type === 'wallet');
  
  for (const wallet of wallets) {
    try {
      await storeWalletAddress(authId, wallet);
    } catch (error) {
      console.error(`Failed to store wallet ${wallet.address}:`, error);
    }
  }
};

export const storeWalletAddressWithUserIdAndAuth = async (
  authId: string,
  userId: string,
  wallet: { address: string; chain_type: string }
) => {
  try {
    if (!userId || !authId) {
      throw new Error('Missing required user IDs');
    }

    const { data, error } = await supabase
      .from('wallet_addresses')
      .upsert({
        user_id: userId,
        blockchain: wallet.chain_type,
        address: wallet.address,
        verified: true,
        verification_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store wallet: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error storing wallet address:', error);
    throw error;
  }
};

export const getBlockchainName = (chainId: number): string => {
  const chainMap: { [key: number]: string } = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    56: 'BSC',
    // Add more chains as needed
  };
  return chainMap[chainId] || 'Unknown';
};
