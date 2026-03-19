import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import { ethers } from 'ethers';

const contractAddress = process.env.CONTRACT_ADDRESS;
const rpcUrl = process.env.RPC_URL;
const wsRpcUrl = process.env.WS_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

// Standard HTTP provider for reads, writes, and backfill queries
const provider = new ethers.JsonRpcProvider(rpcUrl);

// Optional WebSocket provider for live event subscriptions
const wsProvider = wsRpcUrl ? new ethers.WebSocketProvider(wsRpcUrl) : null;

// Wallet signs transactions using HTTP provider
const wallet = new ethers.Wallet(privateKey, provider);

const abi = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function mint(address to, uint256 amount)',
  'function burn(address from, uint256 amount)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// Contract for transactions and standard reads
const contract = new ethers.Contract(contractAddress, abi, wallet);

// Separate contract instance for live event subscriptions if WebSocket exists
const liveContract = wsProvider
  ? new ethers.Contract(contractAddress, abi, wsProvider)
  : contract;

export { provider, wsProvider, wallet, contract, liveContract, ethers };
