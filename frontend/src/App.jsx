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

  const fetchBalance = () => {
    fetch(`http://localhost:3001/api/v1/balance/${walletAddress}`)
      .then((res) => res.json())
      .then((data) => setWalletBalance(data));
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
      {/* <div className="header">
        <h1 className="title">DappUSD Stablecoin Dashboard</h1>
        <p className="subtitle">Blockchain monitoring and token analytics</p>
      </div> */}

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
          <div className="json-box">
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
