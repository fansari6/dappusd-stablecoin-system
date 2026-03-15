# DappUSD Stablecoin System

Full-stack blockchain infrastructure project implementing an ERC-20 stablecoin, backend transaction indexing, and a monitoring dashboard.

## Architecture

React Dashboard  
↓  
Node.js / Express API  
↓  
Ethereum Smart Contract (ERC-20)  
↓  
PostgreSQL Transaction Index

## Features

### Smart Contract
- ERC-20 token (DappUSD)
- Mint, Transfer, Burn
- Transfer event emission
- Hardhat development environment

### Backend API
- Node.js + Express
- Versioned REST API (`/api/v1`)
- Blockchain integration using ethers.js
- PostgreSQL transaction indexing
- Event-driven blockchain indexer
- Rate limiting
- Security headers (Helmet)
- Request logging (Morgan)
- Global error handling
- Input validation
- Graceful shutdown

### Database
PostgreSQL table:

| Column | Description |
|------|-------------|
| tx_hash | Blockchain transaction hash |
| from_address | Sender wallet |
| to_address | Recipient wallet |
| amount | Token amount |
| block_number | Ethereum block |
| created_at | Timestamp |

### Frontend Dashboard
React + Vite dashboard showing:

- API health
- Blockchain connectivity
- Token metadata
- Total supply
- Wallet balance lookup
- Indexed transaction count
- Transaction history table

## API Endpoints

### System

