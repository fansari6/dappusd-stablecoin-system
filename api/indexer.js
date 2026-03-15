import { contract, ethers } from './contract.js';
import pool from './db.js';

export function startIndexer() {
  contract.on('Transfer', async (from, to, value, event) => {
    try {
      const amount = ethers.formatUnits(value, 18);

      await pool.query(
        `INSERT INTO transactions (tx_hash, from_address, to_address, amount, block_number)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (tx_hash) DO NOTHING`,
        [event.log.transactionHash, from, to, amount, event.log.blockNumber],
      );

      console.log('Indexed Transfer event:', event.log.transactionHash);
    } catch (error) {
      console.error('Transfer indexing error:', error);
    }
  });
}
