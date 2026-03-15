import dotenv from 'dotenv';
dotenv.config({ quiet: true });
import express from 'express';
import cors from 'cors';
import { contract, ethers, wallet, provider } from './contract.js';
import pool from './db.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { startIndexer } from './indexer.js';

const API_PREFIX = '/api/v1';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later',
  },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many write requests, please try again later',
  },
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(apiLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'DappUSD Payment is running' });
});

app.get(`${API_PREFIX}/token-info`, async (req, res) => {
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();

    res.json({
      name,
      symbol,
      totalSupply: ethers.formatUnits(totalSupply, 18),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum add' });
    }

    const balance = await contract.balanceOf(address);

    res.json({
      address,
      balance: ethers.formatUnits(balance, 18),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/mint', writeLimiter, async (req, res) => {
  try {
    const { to, amount } = req.body;

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    if (!/^\d+(\.\d{1,18})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: 'Amount supports up to 18 decimal places',
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }

    if (to === ethers.ZeroAddress) {
      return res
        .status(400)
        .json({ error: 'Recipient cannot be zero address' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const tx = await contract.mint(
      to,
      ethers.parseUnits(amount.toString(), 18),
    );
    const receipt = await tx.wait();

    res.json({
      message: 'Tokens minted successfully',
      to,
      amount,
      transactionHash: receipt.hash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(`${API_PREFIX}/transfer`, writeLimiter, async (req, res) => {
  try {
    const { to, amount } = req.body;

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    if (!/^\d+(\.\d{1,18})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: 'Amount supports up to 18 decimal places',
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid receipient address' });
    }

    if (to === ethers.ZeroAddress) {
      return res
        .status(400)
        .json({ error: 'Recipient cannot be zero address' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const tx = await contract.transfer(
      to,
      ethers.parseUnits(amount.toString(), 18),
    );

    const receipt = await tx.wait();

    res.json({
      message: 'Tokens transferred successfully',
      from: wallet.address,
      to,
      amount,
      transactionHash: receipt.hash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get(`${API_PREFIX}/transactions`, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions ORDER BY created_at DESC',
    );

    res.json(result.rows);
  } catch (error) {
    console.error('transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const result = await pool.query(
      `SELECT * FROM transactions
       WHERE from_address = $1 OR to_address = $1
       ORDER BY created_at DESC`,
      [address],
    );

    res.json(result.rows);
  } catch (error) {
    console.error('transactions by address error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get(`${API_PREFIX}/health`, async (req, res) => {
  try {
    await pool.query('SELECT 1');

    const blockNumber = await contract.runner.provider.getBlockNumber();

    res.json({
      status: 'ok',
      service: 'stablecoin-api',
      database: 'connected',
      blockchain: 'connected',
      latestBlock: blockNumber,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'stablecoin-api',
      database: 'disconnected',
      blockchain: 'disconnected',
      error: error.message,
    });
  }
});

app.post('/burn', writeLimiter, async (req, res, next) => {
  try {
    const { from, amount } = req.body;

    if (!ethers.isAddress(from)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    if (from === ethers.ZeroAddress) {
      return res.status(400).json({ error: 'Source cannot be zero address' });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    if (!/^\d+(\.\d{1,18})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: 'Amount supports up to 18 decimal places',
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const tx = await contract.burn(
      from,
      ethers.parseUnits(amount.toString(), 18),
    );
    const receipt = await tx.wait();

    await pool.query(
      `INSERT INTO transactions (tx_hash, from_address, to_address, amount, block_number)
        VALUES ($1, $2, $3, $4, $5)`,
      [receipt.hash, from, 'burn', amount, receipt.blockNumber],
    );

    res.json({
      message: 'Tokens burned successfully',
      from,
      amount,
      transactionHash: receipt.hash,
    });
  } catch (error) {
    next(error);
  }
});

app.get(`${API_PREFIX}/total-supply`, async (req, res, next) => {
  try {
    const supply = await contract.totalSupply();

    res.json({
      totalSupply: ethers.formatUnits(supply, 18),
    });
  } catch (error) {
    next(error);
  }
});

app.get(`${API_PREFIX}/transaction-count`, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM transactions',
    );

    res.json({
      transactionCount: result.rows[0].count,
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);

  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log('API wallet:', wallet.address);

  startIndexer();
});

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

process.on('SIGINT', async () => {
  console.log('Shutting down server...');

  try {
    await pool.end();
    console.log('PostgreSQL pool closed');
  } catch (err) {
    console.error('Error closing PostgreSQL pool:', err);
  }

  process.exit(0);
});
