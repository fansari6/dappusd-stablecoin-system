import { useEffect, useState } from 'react';
import './App.css';
import logo from './assets/dapp-architects-website-logo.png';

function App() {
  const [health, setHealth] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [supply, setSupply] = useState(null);
  const [transactionCount, setTransactionCount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  const [connectedAccount, setConnectedAccount] = useState('');
  const [connectedChainId, setConnectedChainId] = useState('');
  const [connectedBalance, setConnectedBalance] = useState(null);
  const [walletError, setWalletError] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferStatus, setTransferStatus] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintStatus, setMintStatus] = useState('');
  const [burnFrom, setBurnFrom] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [burnStatus, setBurnStatus] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const healthRes = await fetch('http://localhost:3001/api/v1/health');
        const healthData = await healthRes.json();
        if (healthRes.ok) setHealth(healthData);

        const tokenInfoRes = await fetch(
          'http://localhost:3001/api/v1/token-info',
        );
        const tokenInfoData = await tokenInfoRes.json();
        if (tokenInfoRes.ok) setTokenInfo(tokenInfoData);

        const supplyRes = await fetch(
          'http://localhost:3001/api/v1/total-supply',
        );
        const supplyData = await supplyRes.json();
        if (supplyRes.ok) setSupply(supplyData);

        const countRes = await fetch(
          'http://localhost:3001/api/v1/transaction-count',
        );
        const countData = await countRes.json();
        if (countRes.ok) setTransactionCount(countData);

        const txRes = await fetch('http://localhost:3001/api/v1/transactions');
        const txData = await txRes.json();
        if (txRes.ok) {
          setTransactions(Array.isArray(txData) ? txData : []);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('Dashboard refresh error:', error);
      }
    };

    loadDashboardData();

    const interval = setInterval(loadDashboardData, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      const account = accounts[0] || '';
      setConnectedAccount(account);

      if (account) {
        fetch(`http://localhost:3001/api/v1/balance/${account}`)
          .then((res) => res.json())
          .then((data) => setConnectedBalance(data.balance))
          .catch((err) => {
            console.error('Accounts changed balance fetch error:', err);
            setConnectedBalance(null);
          });
      } else {
        setConnectedBalance(null);
      }
    };

    const handleChainChanged = (chainId) => {
      setConnectedChainId(chainId);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const fetchBalance = () => {
    fetch(`http://localhost:3001/api/v1/balance/${walletAddress}`)
      .then((res) => res.json())
      .then((data) => setWalletBalance(data));
  };

  const formatChainName = (chainId) => {
    if (chainId === '0x7a69') return 'Localhost Hardhat';
    if (chainId === '0xaa36a7') return 'Sepolia';
    return chainId || 'Not connected';
  };

  const connectWallet = async () => {
    try {
      setWalletError('');

      if (!window.ethereum) {
        setWalletError('MetaMask is not installed');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      const account = accounts[0] || '';

      setConnectedAccount(account);
      setConnectedChainId(chainId);

      if (account) {
        fetch(`http://localhost:3001/api/v1/balance/${account}`)
          .then((res) => res.json())
          .then((data) => setConnectedBalance(data.balance))
          .catch((err) => {
            console.error('Connected wallet balance fetch error:', err);
            setConnectedBalance(null);
          });
      }
    } catch (error) {
      console.error('Wallet connect error:', error);
      setWalletError(error.message || 'Failed to connect wallet');
    }
  };

  const handleTransfer = async () => {
    try {
      setTransferStatus('Sending...');

      const res = await fetch('http://localhost:3001/api/v1/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: transferTo,
          amount: transferAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTransferStatus(data.error || 'Transfer failed');
        return;
      }

      setTransferStatus(`Success: ${data.transactionHash}`);
      setTransferTo('');
      setTransferAmount('');
      loadDashboardData();
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferStatus('Transfer failed');
    }
  };

  const handleMint = async () => {
    try {
      setMintStatus('Minting...');

      const res = await fetch('http://localhost:3001/api/v1/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: mintTo,
          amount: mintAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMintStatus(data.error || 'Mint failed');
        return;
      }

      setMintStatus(`Success: ${data.transactionHash}`);
      setMintTo('');
      setMintAmount('');
    } catch (error) {
      console.error('Mint error:', error);
      setMintStatus('Mint failed');
    }
  };

  const handleBurn = async () => {
    try {
      setBurnStatus('Burning...');

      const res = await fetch('http://localhost:3001/api/v1/burn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: burnFrom,
          amount: burnAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBurnStatus(data.error || 'Burn failed');
        return;
      }

      setBurnStatus(`Success: ${data.transactionHash}`);
      setBurnFrom('');
      setBurnAmount('');
    } catch (error) {
      console.error('Burn error:', error);
      setBurnStatus('Burn failed');
    }
  };

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  function formatTxParty(address, column) {
    if (!address || typeof address !== 'string') {
      return 'unknown';
    }

    const normalized = address.toLowerCase();

    if (column === 'from' && normalized === ZERO_ADDRESS) {
      return 'mint';
    }

    if (column === 'to' && normalized === ZERO_ADDRESS) {
      return 'burn';
    }

    if (address.length < 10) {
      return address;
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
    <div className="app">
      <div
        className="header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 className="title">DappUSD Stablecoin Dashboard</h1>
          <p className="subtitle">Blockchain monitoring and token analytics</p>
        </div>

        <img
          src={logo}
          alt="Dapp Architects"
          style={{
            height: '70px',
            borderRadius: '12px',
          }}
        />
      </div>

      <div className="card">
        <h2>Connected Wallet</h2>

        <div className="lookup-row">
          <button onClick={connectWallet}>Connect MetaMask</button>
        </div>

        {walletError && (
          <div
            className="label"
            style={{ color: '#ff6b6b', marginTop: '10px' }}
          >
            {walletError}
          </div>
        )}

        <div className="grid" style={{ marginTop: '16px' }}>
          <div>
            <div className="label">Address</div>
            <div className="mono">
              {connectedAccount
                ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(
                    -4,
                  )}`
                : 'Not connected'}
            </div>
          </div>

          <div>
            <div className="label">Network</div>
            <div>{formatChainName(connectedChainId)}</div>
          </div>

          <div>
            <div className="label">DUSD Balance</div>
            <div>{connectedBalance ?? 'Not connected'}</div>
          </div>

          <div>
            <div className="label">Mode</div>
            <div>Backend-controlled transactions</div>
          </div>
        </div>

        <div className="card">
          <h2>Mint DUSD</h2>

          <div className="lookup-row" style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Recipient address"
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
            />
          </div>

          <div className="lookup-row">
            <input
              type="text"
              placeholder="Amount"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
            />

            {/* <button onClick={handleMint}>Mint</button> */}
            <button onClick={handleMint} disabled={mintStatus === 'Minting...'}>
              {mintStatus === 'Minting...' ? 'Minting...' : 'Mint'}
            </button>
          </div>

          {mintStatus && (
            <div className="json-box" style={{ marginTop: '12px' }}>
              <pre>{mintStatus}</pre>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Transfer DUSD</h2>

          <div className="lookup-row" style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Recipient address"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            />
          </div>

          <div className="lookup-row">
            <input
              type="text"
              placeholder="Amount"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />

            {/* <button onClick={handleTransfer}>Send</button> */}
            <button
              onClick={handleTransfer}
              disabled={transferStatus === 'Sending...'}
            >
              {transferStatus === 'Sending...' ? 'Sending...' : 'Send'}
            </button>
          </div>

          {transferStatus && (
            <div className="json-box" style={{ marginTop: '12px' }}>
              <pre>{transferStatus}</pre>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Burn DUSD</h2>

          <div className="lookup-row" style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Source address"
              value={burnFrom}
              onChange={(e) => setBurnFrom(e.target.value)}
            />
          </div>

          <div className="lookup-row">
            <input
              type="text"
              placeholder="Amount"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
            />

            {/* <button onClick={handleBurn}>Burn</button> */}
            <button onClick={handleBurn} disabled={burnStatus === 'Burning...'}>
              {burnStatus === 'Burning...' ? 'Burning...' : 'Burn'}
            </button>
          </div>

          {burnStatus && (
            <div className="json-box" style={{ marginTop: '12px' }}>
              <pre>{burnStatus}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>API Status</h2>
          <div className="metric status-ok">
            {health ? health.status : 'Loading'}
          </div>
        </div>

        <div className="card">
          <h2>Blockchain</h2>
          <div className="metric metric-blue">
            {health ? health.latestBlock : '...'}
          </div>
          <div className="label">Latest Block</div>
        </div>

        <div className="card">
          <h2>Total Supply</h2>
          <div className="metric metric-purple">
            {supply ? supply.totalSupply : '...'}
          </div>
        </div>

        <div className="card">
          <h2>Transactions Indexed</h2>
          <div className="metric metric-orange">
            {transactionCount ? transactionCount.transactionCount : '...'}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Token Info</h2>

        {tokenInfo && (
          <div className="grid">
            <div>
              <div className="label">Name</div>
              <div>{tokenInfo.name}</div>
            </div>

            <div>
              <div className="label">Symbol</div>
              <div>{tokenInfo.symbol}</div>
            </div>

            <div>
              <div className="label">Total Supply</div>
              <div>{tokenInfo.totalSupply}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Wallet Balance Lookup</h2>

        <div className="lookup-row">
          <input
            type="text"
            placeholder="Enter wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />

          <button onClick={fetchBalance}>Check Balance</button>
        </div>

        {walletBalance && (
          // <div className="json-box">
          <div
            className="json-box"
            style={{
              backgroundColor: transferStatus.includes('Success')
                ? '#e6fffa'
                : '#ffe6e6',
              color: transferStatus.includes('Success') ? '#065f46' : '#7f1d1d',
            }}
          >
            <pre>{JSON.stringify(walletBalance, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Transactions</h2>
        <p className="subtitle-small">Auto-refreshes every 10 seconds</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tx Hash</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Block</th>
              </tr>
            </thead>

            <tbody>
              {(Array.isArray(transactions) ? transactions : []).map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>

                  <td className="mono">
                    {tx.tx_hash
                      ? `${tx.tx_hash.slice(0, 8)}...${tx.tx_hash.slice(-6)}`
                      : 'unknown'}
                  </td>

                  <td className="mono">
                    {formatTxParty(tx.from_address, 'from')}
                  </td>
                  <td className="mono">{formatTxParty(tx.to_address, 'to')}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.block_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;

// // Test backend connection

// import { useEffect, useState } from 'react';

// function App() {
//   const [health, setHealth] = useState(null);

//   useEffect(() => {
//     fetch('http://localhost:3001/api/v1/health')
//       .then((res) => res.json())
//       .then((data) => setHealth(data))
//       .catch((err) => console.error(err));
//   }, []);

//   return (
//     <div style={{ fontFamily: 'Arial', padding: '40px' }}>
//       <h1>Dapp USD Dashboard</h1>

//       <h2>System Health</h2>

//       {health ? (
//         <pre>{JSON.stringify(health, null, 2)}</pre>
//       ) : (
//         <p>Loading...</p>
//       )}
//     </div>
//   );
// }

// export default App;
