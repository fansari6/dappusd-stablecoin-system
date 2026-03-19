// function startLiveListener() is disabled
// function startLiveListener() {
//   console.log('Starting live Transfer listener...');

//   // For websocket
//   // liveContract.on('Transfer', async (from, to, value, event) => {

//   contract.on('Transfer', async (from, to, value, event) => {
//     try {
//       await insertTransferEvent(
//         from,
//         to,
//         value,
//         event.log.transactionHash,
//         event.log.blockNumber,
//       );

//       await setLastIndexedBlock(event.log.blockNumber);

//       console.log('Indexed live Transfer event:', event.log.transactionHash);
//     } catch (error) {
//       console.error('Live Transfer indexing error:', error);
//     }
//   });
// }

import { contract, provider, ethers } from './contract.js';
import pool from './db.js';

/*
===========================================================
 DappUSD Blockchain Indexer (Polling Version)
===========================================================

Purpose
-------
This module listens to ERC20 Transfer events from the DappUSD smart contract
and stores them in PostgreSQL.

Architecture
------------
Instead of using real-time WebSocket listeners (which can be unstable),
this implementation uses a **polling-based indexer**:

1. On startup → Backfill missing blocks
2. Every few seconds → Check for new blocks and index them

Why polling?
------------
- More stable than event listeners in local/dev environments
- Avoids hanging issues caused by provider subscriptions
- Easy to debug and production-safe for MVPs

===========================================================
*/

// Row ID used in indexer_state table (single row checkpoint)
const INDEXER_ID = 1;

// Number of block confirmations before indexing
// (0 for local Hardhat, increase to 1–3 for real networks)
const CONFIRMATIONS = 0;

// Batch size for scanning blocks (prevents RPC overload)
const BATCH_SIZE = 500;

// Polling interval (in milliseconds)
const POLL_INTERVAL_MS = 3000;

// Timer reference for polling loop
let pollingHandle = null;

// Lock to prevent overlapping polling executions
let isPolling = false;

/*
-----------------------------------------------------------
 Read last indexed block from DB
-----------------------------------------------------------
This acts as a checkpoint so we don’t reprocess old blocks.
*/
async function getLastIndexedBlock() {
  const result = await pool.query(
    'SELECT last_indexed_block FROM indexer_state WHERE id = $1',
    [INDEXER_ID],
  );

  if (result.rows.length === 0) {
    throw new Error(
      'indexer_state row not found. Initialize indexer_state table first.',
    );
  }

  return Number(result.rows[0].last_indexed_block);
}

/*
-----------------------------------------------------------
 Update checkpoint in DB
-----------------------------------------------------------
After processing a block range, we store the latest block.
*/
async function setLastIndexedBlock(blockNumber) {
  await pool.query(
    `UPDATE indexer_state
     SET last_indexed_block = $1
     WHERE id = $2`,
    [blockNumber, INDEXER_ID],
  );
}

/*
-----------------------------------------------------------
 Insert Transfer event into DB
-----------------------------------------------------------
- Converts value from wei → human-readable format
- Prevents duplicates using UNIQUE(tx_hash)
*/
async function insertTransferEvent(from, to, value, txHash, blockNumber) {
  const amount = ethers.formatUnits(value, 18);

  await pool.query(
    `INSERT INTO transactions
      (tx_hash, from_address, to_address, amount, block_number)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tx_hash) DO NOTHING`,
    [txHash, from, to, amount, blockNumber],
  );
}

/*
-----------------------------------------------------------
 Process a range of blocks
-----------------------------------------------------------
Fetches all Transfer events within a block range.
*/
async function processBlockRange(fromBlock, toBlock) {
  const transferFilter = contract.filters.Transfer();

  const events = await contract.queryFilter(transferFilter, fromBlock, toBlock);

  for (const event of events) {
    const { args } = event;
    if (!args) continue;

    const from = args[0];
    const to = args[1];
    const value = args[2];

    await insertTransferEvent(
      from,
      to,
      value,
      event.transactionHash,
      event.blockNumber,
    );
  }

  // Update checkpoint after processing batch
  await setLastIndexedBlock(toBlock);

  console.log(
    `Indexed blocks ${fromBlock}-${toBlock}. Events found: ${events.length}`,
  );
}

/*
-----------------------------------------------------------
 Backfill missing blocks
-----------------------------------------------------------
Runs on startup AND during polling.

Logic:
1. Get last indexed block
2. Get latest blockchain block
3. Process any missing blocks in batches
*/
async function backfillTransfers() {
  const lastIndexedBlock = await getLastIndexedBlock();
  const latestBlock = await provider.getBlockNumber();

  // Apply confirmation buffer
  const safeLatestBlock = Math.max(0, latestBlock - CONFIRMATIONS);

  // Nothing new to index
  if (lastIndexedBlock >= safeLatestBlock) {
    console.log(
      `No backfill needed. lastIndexedBlock=${lastIndexedBlock}, latestBlock=${safeLatestBlock}`,
    );
    return;
  }

  let fromBlock = lastIndexedBlock + 1;

  // Process blocks in batches
  while (fromBlock <= safeLatestBlock) {
    const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, safeLatestBlock);

    console.log(
      `Backfilling Transfer events from block ${fromBlock} to ${toBlock}...`,
    );

    await processBlockRange(fromBlock, toBlock);

    fromBlock = toBlock + 1;
  }

  console.log('Backfill complete.');
}

/*
-----------------------------------------------------------
 Start polling indexer
-----------------------------------------------------------
Flow:
1. Run initial backfill
2. Start polling every few seconds
3. Prevent overlapping executions using a lock
*/
export async function startIndexer() {
  try {
    await backfillTransfers();
    console.log('Indexer startup backfill complete.');

    pollingHandle = setInterval(async () => {
      // Prevent overlapping runs
      if (isPolling) return;

      isPolling = true;

      try {
        await backfillTransfers();
      } catch (error) {
        console.error('Polling indexer error:', error);
      } finally {
        isPolling = false;
      }
    }, POLL_INTERVAL_MS);

    console.log(
      `Polling indexer started (every ${POLL_INTERVAL_MS / 1000} seconds).`,
    );
  } catch (error) {
    console.error('Indexer startup failed:', error);
    throw error;
  }
}

/*
-----------------------------------------------------------
 Stop indexer (graceful shutdown)
-----------------------------------------------------------
*/
export function stopIndexer() {
  if (pollingHandle) {
    clearInterval(pollingHandle);
    pollingHandle = null;
  }
}
