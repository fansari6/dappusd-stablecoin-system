1. mkdir stablecoin-payment-system
2. cd stablecoin-payment-system
3. Directory structure:
    stablecoin-payment-system/
    ├── contracts/
    ├── scripts/
    ├── test/
    ├── hardhat.config.js
    ├── package.json
    └── node_modules/
3. npm init -y
4. npm install --save-dev hardhat
5 npx hardhat --init
    SELECT -> Minimum Hardhat Project
6. In package.json remove:
    "typescript": "~5.8.0"
7. npm install --save-dev @nomicfoundation/hardhat-toolbox-mocha-ethers
8. npm install @openzeppelin/contracts
9. Replace hardhat.config.ts with the following hardhat.config.js:
    import { defineConfig } from 'hardhat/config';
    import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';

    export default defineConfig({
    plugins: [hardhatToolboxMochaEthers],
    solidity: '0.8.28',
    });
10. Delete tsconfig.json
11. Create contracts/DappUSD.sol
12. Create scripts/deploy.js
13. npx hardhat node
14. npx hardhat compile
15. npx hardhat run scripts/deploy.js --network localhost
16. npx hardhat test

# Version 3:

17. npm install express ethers dotenv cors
18. stablecoin-payment-system/
    ├── api/
    │   ├── server.js
    │   ├── contract.js
    │   └── .env
    ├── contracts/
    ├── scripts/
    ├── test/

19. node api/server.js

20. To fix port issues:
    lsof -i :3001
    kill -9 <PID>

21. npm install pg
22. npm install express-rate-limit
23. npm install helmet
24. npm install morgan
25. npm create vite@latest frontend
    Select:
        React
        Javascript
26. cd frontend
27. npm install
28. npm run dev

## TESTING THE API

# Check if the API server is running
curl http://localhost:3001/

Tests that:
Express server is running
API port is reachable
routing is working

Expected response
{
  "message": "API is running"
}

# Get token information
curl http://localhost:3001/token-info

Calls the smart contract read functions:
name()
symbol()
totalSupply()

This proves:
API → ethers.js works
ethers.js → smart contract works
blockchain read calls work

Expected response
{
  "name": "Dapp USD",
  "symbol": "DUSD",
  "totalSupply": "200.0"
}

# Mint new tokens
curl -X POST http://localhost:3001/mint \
  -H "Content-Type: application/json" \
  -d '{
    "to":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "amount":"100"
  }'

Calls the smart contract:
mint(address,uint256)

This proves:

API can send blockchain transactions
wallet signing works
contract role permissions work
blockchain state changes

Expected response
{
  "message": "Tokens minted successfully",
  "to": "...",
  "amount": "100",
  "transactionHash": "..."
}

# Check wallet balance
curl http://localhost:3001/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Calls the smart contract:
balanceOf(address)

This verifies:

blockchain state updated after mint/transfer
API reads contract state correctly

Expected response
{
  "address": "...",
  "balance": "100.0"
}

# Transfer tokens
curl -X POST http://localhost:3001/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "to":"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "amount":"25"
  }'

Calls the smart contract:

transfer(address,uint256)

This proves:

blockchain transactions work through API
wallet signing works
token balances update

Expected response
{
  "message": "Tokens transferred successfully",
  "from": "...",
  "to": "...",
  "amount": "25",
  "transactionHash": "..."
}

## The complete test flow (recommended order)

Run these in this order:

1. curl http://localhost:3001/

2. curl http://localhost:3001/token-info

3. curl -X POST http://localhost:3001/mint \
  -H "Content-Type: application/json" \
  -d '{"to":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","amount":"100"}'

4. curl http://localhost:3001/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

5. curl -X POST http://localhost:3001/transfer \
  -H "Content-Type: application/json" \
  -d '{"to":"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC","amount":"25"}'

6. curl http://localhost:3001/balance/0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

## PostgreSQL-related commands for this project, in one place, in the order that matters.

1. Open PostgreSQL from Terminal

This opens the PostgreSQL shell:

/Library/PostgreSQL/18/bin/psql -U postgres

If you want to open a specific database directly:

/Library/PostgreSQL/18/bin/psql -U postgres -d stablecoin_db

You’ll be prompted for your PostgreSQL password.

2. Create the project database

Run this at the postgres=# prompt:

CREATE DATABASE stablecoin_db;
3. Connect to the project database

From inside psql:

\c stablecoin_db
4. Create the transactions table

Run this inside stablecoin_db:

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tx_hash TEXT UNIQUE NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    block_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
5. Check all rows in the transactions table

Use this to verify inserts:

SELECT * FROM transactions;
6. Create an index for wallet lookups

This improves performance for queries by sender/recipient wallet:

CREATE INDEX idx_transactions_wallets
ON transactions (from_address, to_address);
7. List indexes

Use this to verify the index exists:

\di

You should see something like:

transactions_pkey

transactions_tx_hash_key

idx_transactions_wallets

8. Quick database connection test from psql

If you want to verify you are connected:

SELECT NOW();

This returns the current database timestamp.

9. Exit PostgreSQL shell

When you are done:

\q
10. App .env database settings

These are not psql commands, but they are part of the database setup:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=stablecoin_db
DB_USER=postgres
DB_PASSWORD="2021BMW#m4"

Important: because your password contains #, it must be in quotes.

11. API-side database connection test

This is the temporary code we used in server.js to verify PostgreSQL connectivity:

(async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', result.rows[0]);
  } catch (err) {
    console.error('PostgreSQL connection error:', err);
  }
})();

12. Useful full workflow

From scratch, the database setup flow is:

/Library/PostgreSQL/18/bin/psql -U postgres

Then inside psql:

CREATE DATABASE stablecoin_db;
\c stablecoin_db

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tx_hash TEXT UNIQUE NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    block_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_wallets
ON transactions (from_address, to_address);

SELECT * FROM transactions;
\di
\q

13. Useful verification command

Any time later, to inspect your transaction records:

/Library/PostgreSQL/18/bin/psql -U postgres -d stablecoin_db

Then:

SELECT * FROM transactions;

## Complete curl testing cheat sheet for your API, in the order you should normally run them.

1. Check if the API is running

Tests that the Express server is alive.

curl http://localhost:3001/

Expected response:

{"message":"API is running"}

2. Health check (API + Database)

Verifies:

API is alive

PostgreSQL connection works

curl http://localhost:3001/health

Expected response:

{
  "status": "ok",
  "service": "stablecoin-api",
  "database": "connected"
}
3. Get token metadata

Calls smart contract read functions.

Tests:

API → blockchain connectivity

ethers.js interaction

curl http://localhost:3001/token-info

Expected response example:

{
  "name": "Dapp USD",
  "symbol": "DUSD",
  "totalSupply": "210.0"
}

4. Mint tokens

Creates new tokens on the blockchain.

Tests:

contract mint function

wallet signing

API → blockchain transaction

curl -X POST http://localhost:3001/mint \
  -H "Content-Type: application/json" \
  -d '{
    "to":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "amount":"100"
  }'

Example response:

{
  "message":"Tokens minted successfully",
  "to":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "amount":"100",
  "transactionHash":"0x..."
}
5. Check wallet balance

Reads token balance from the smart contract.

curl http://localhost:3001/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Example response:

{
  "address":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "balance":"100.0"
}

6. Transfer tokens

Transfers tokens from the API wallet to another address.

Tests:

smart contract transfer

transaction signing

blockchain execution

PostgreSQL storage

curl -X POST http://localhost:3001/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "to":"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "amount":"25"
  }'

Example response:

{
  "message":"Tokens transferred successfully",
  "from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "to":"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "amount":"25",
  "transactionHash":"0x..."
}
7. Verify recipient balance

Confirms blockchain state changed.

curl http://localhost:3001/balance/0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

Example response:

{
  "address":"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "balance":"25.0"
}
8. Get all transactions

Reads transaction history from PostgreSQL.

curl http://localhost:3001/transactions

Example response:

[
  {
    "id":1,
    "tx_hash":"0x...",
    "from_address":"0xf39Fd6e...",
    "to_address":"0x3C44Cd...",
    "amount":"25",
    "block_number":6,
    "created_at":"2026-03-14T14:24:56.064Z"
  }
]
9. Get transactions by wallet

Filters transaction history by wallet address.

curl http://localhost:3001/transactions/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Example response:

[
  {
    "id":1,
    "tx_hash":"0x...",
    "from_address":"0xf39Fd6e...",
    "to_address":"0x15d34A...",
    "amount":"10",
    "block_number":6,
    "created_at":"2026-03-14T14:24:56.064Z"
  }
]
Complete API test sequence

When testing from scratch, run in this order:

curl http://localhost:3001/

curl http://localhost:3001/health

curl http://localhost:3001/token-info

curl -X POST http://localhost:3001/mint \
-H "Content-Type: application/json" \
-d '{"to":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","amount":"100"}'

curl http://localhost:3001/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

curl -X POST http://localhost:3001/transfer \
-H "Content-Type: application/json" \
-d '{"to":"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC","amount":"25"}'

curl http://localhost:3001/balance/0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

curl http://localhost:3001/transactions

curl http://localhost:3001/transactions/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

If you'd like, I can also give you the final project architecture diagram and folder structure, which will make this project look much stronger when you put it on GitHub or your Dapp Architects portfolio.