import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { contract, ethers, wallet, provider } from './contract.js';
import pool from './db.js';
import { startIndexer } from './indexer.js';

// Base prefix so all API routes stay consistent
const API_PREFIX = '/api/v1';

// General limiter for all API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later',
  },
});

// Stricter limiter for write/blockchain-changing routes
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

// Security and request-parsing middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(apiLimiter);

// Simple root route to confirm the API is running
app.get('/', (req, res) => {
  console.log('root route hit');
  res.json({ message: 'DappUSD Payment API is running' });
});

// Returns basic token metadata from the smart contract
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

// Returns token balance for a given Ethereum address
app.get(`${API_PREFIX}/balance/:address`, async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
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

// Admin mint endpoint
// Mints new DUSD to a target address using the backend wallet
app.post(`${API_PREFIX}/mint`, writeLimiter, async (req, res) => {
  try {
    const { to, amount } = req.body;

    // Validate amount presence and numeric value
    if (
      amount === undefined ||
      amount === null ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res
        .status(400)
        .json({ error: 'Amount must be a valid number and greater than zero' });
    }

    // Allow up to 18 decimal places
    if (!/^\d+(\.\d{1,18})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: 'Amount supports up to 18 decimal places',
      });
    }

    // Validate recipient address
    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }

    if (to === ethers.ZeroAddress) {
      return res
        .status(400)
        .json({ error: 'Recipient cannot be zero address' });
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

// Transfers DUSD from the backend wallet to another address
// Important: this sends tokens FROM wallet.address, not from an arbitrary user wallet
app.post(`${API_PREFIX}/transfer`, writeLimiter, async (req, res) => {
  try {
    const { to, amount } = req.body;

    // Validate amount
    if (
      amount === undefined ||
      amount === null ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res
        .status(400)
        .json({ error: 'Amount must be a valid number and greater than zero' });
    }

    // Allow up to 18 decimal places
    if (!/^\d+(\.\d{1,18})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: 'Amount supports up to 18 decimal places',
      });
    }

    // Validate recipient address
    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }

    if (to === ethers.ZeroAddress) {
      return res
        .status(400)
        .json({ error: 'Recipient cannot be zero address' });
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

// Returns all indexed transactions from PostgreSQL
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

// Returns indexed transactions for one specific wallet address
app.get(`${API_PREFIX}/transactions/:address`, async (req, res) => {
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

// Health-check endpoint for API, database, and blockchain connectivity
app.get(`${API_PREFIX}/health`, async (req, res) => {
  try {
    // Simple DB connectivity test
    await pool.query('SELECT 1');

    // Get latest chain block to confirm RPC/provider is working
    const blockNumber = await provider.getBlockNumber();

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

// Admin burn endpoint
// Burns tokens from a target address using the backend wallet's BURNER_ROLE
app.post(`${API_PREFIX}/burn`, writeLimiter, async (req, res, next) => {
  try {
    const { from, amount } = req.body;

    // Validate source address
    if (!ethers.isAddress(from)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    if (from === ethers.ZeroAddress) {
      return res.status(400).json({ error: 'Source cannot be zero address' });
    }

    // Validate amount
    if (
      amount === undefined ||
      amount === null ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res
        .status(400)
        .json({ error: 'Amount must be a valid number and greater than zero' });
    }

    // Allow up to 18 decimal places
    if (!/^\d+(\.\d{1,18})?$/.test(amount.toString())) {
      return res.status(400).json({
        error: 'Amount supports up to 18 decimal places',
      });
    }

    const tx = await contract.burn(
      from,
      ethers.parseUnits(amount.toString(), 18),
    );

    const receipt = await tx.wait();

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

// Returns formatted total token supply
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

// Returns number of indexed transactions stored in PostgreSQL
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

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);

  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});

const port = process.env.PORT || 3001;

// Start server and background indexer
app.listen(port, async () => {
  console.log(`API running on http://localhost:${port}`);
  console.log('API wallet:', wallet.address);

  try {
    // await startIndexer();
    startIndexer();
  } catch (error) {
    console.error('Failed to start indexer:', error);
  }
});

// Graceful shutdown on Ctrl+C
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
