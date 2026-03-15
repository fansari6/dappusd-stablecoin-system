## Backend supports:

- mint
- transfer
- burn
- balance lookup
- token metadata
- transaction history
- wallet transaction history
- health checks
- rate limiting
- request logging
- security headers
- graceful shutdown
- input validation
- blockchain connectivity check
- PostgreSQL persistence

- /api/v1/health
- /api/v1/token-info
- /api/v1/balance/:address
- /api/v1/mint
- /api/v1/transfer
- /api/v1/burn
- /api/v1/transactions
- /api/v1/transactions/:address
- /api/v1/total-supply
- /api/v1/transaction-count

## Final project architecture diagram

                    ┌──────────────────────────┐
                    │   Client / Postman /     │
                    │   Future Frontend UI     │
                    └────────────┬─────────────┘
                                 │ HTTP
                                 ▼
                    ┌──────────────────────────────┐
                    │   Node.js API (Express)      │
                    │                              │
                    │  GET  /                      │
                    │  GET  /health                │
                    │  GET  /token-info            │
                    │  GET  /balance/:address      │
                    │  POST /mint                  │
                    │  POST /transfer              │
                    │  GET  /transactions          │
                    │  GET  /transactions/:address │
                    └──────────┬───────┬───────────┘
                               │       │
                    blockchain │       │ database
                               │       │
                               ▼       ▼
               ┌──────────────────┐   ┌────────────────────┐
               │ Ethereum Local   │   │ PostgreSQL         │
               │ Hardhat Network  │   │ stablecoin_db      │
               │                  │   │                    │
               │ DappUSD Contract │   │ transactions table │
               │ - ERC20 token    │   │ indexes            │
               │ - AccessControl  │   │ tx history         │
               │ - Pausable       │   └────────────────────┘
               └──────────────────┘


## Smart contract architecture

                 ┌────────────────────────────┐
                 │         DappUSD            │
                 ├────────────────────────────┤
                 │ ERC20                      │
                 │ AccessControl              │
                 │ ERC20Pausable              │
                 ├────────────────────────────┤
                 │ Roles:                     │
                 │ DEFAULT_ADMIN_ROLE         │
                 │ MINTER_ROLE                │
                 │ BURNER_ROLE                │
                 │ PAUSER_ROLE                │
                 ├────────────────────────────┤
                 │ Functions:                 │
                 │ mint()                     │
                 │ burn()                     │
                 │ pause()                    │
                 │ unpause()                  │
                 │ transfer()                 │
                 │ balanceOf()                │
                 └────────────────────────────┘

## Folder structure

stablecoin-payment-system-v3/
├── api/
│   ├── contract.js
│   ├── db.js
│   ├── server.js
│   └── .env
├── contracts/
│   └── DappUSD.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── DappUSD.test.js
├── hardhat.config.js
├── package.json
└── package-lock.json

## What each file does
contracts/DappUSD.sol

Your stablecoin smart contract:

ERC-20 token

role-based permissions

pause/unpause support

scripts/deploy.js

Deploys the contract to:

local Hardhat network now

Sepolia later

test/DappUSD.test.js

Validates:

deployment

minting

role restrictions

transfers

burn

pause/unpause

api/contract.js

Creates the blockchain connection:

provider

wallet

contract instance

api/db.js

Creates the PostgreSQL connection pool.

api/server.js

Main backend API:
health route
token info
balances
mint
transfer
transaction history

.env

Stores secrets and config:

RPC URL
private key
contract address
DB connection settings

PostgreSQL schema
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tx_hash TEXT UNIQUE NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    block_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes:

CREATE INDEX idx_transactions_wallets
ON transactions (from_address, to_address);
Current API surface
GET  /                       -> API status
GET  /health                -> API + DB health
GET  /token-info            -> token metadata
GET  /balance/:address      -> token balance
POST /mint                  -> mint tokens
POST /transfer              -> transfer tokens
GET  /transactions          -> all saved transfers
GET  /transactions/:address -> wallet-specific history
Portfolio-ready project description

You can use this on GitHub or your website:

Built an Ethereum-based stablecoin payment prototype using Solidity, Hardhat, Node.js, Express, ethers.js, and PostgreSQL. Implemented ERC-20 token operations with role-based access control and pausability, exposed blockchain functionality through REST APIs, and persisted transfer history in a relational database for wallet-based transaction lookup and auditability.

Stronger “architect” version

Designed and implemented a digital asset service prototype combining a regulated-style ERC-20 stablecoin contract, backend transaction orchestration APIs, and PostgreSQL-backed transaction persistence. The system supports minting, transfers, balance queries, operational role separation, and auditable wallet transaction history.

What this project proves about you

It shows you can work across:

smart contracts
backend APIs
blockchain integration
security-minded contract design
relational persistence
system architecture

That is already much stronger than a basic Solidity demo.

Next, the strongest move is to make this portfolio-grade with a README, architecture diagram image, and Sepolia deployment.