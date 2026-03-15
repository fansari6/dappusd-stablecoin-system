import { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [supply, setSupply] = useState(null);
  const [transactionCount, setTransactionCount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/v1/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error(err));

    fetch('http://localhost:3001/api/v1/token-info')
      .then((res) => res.json())
      .then((data) => setTokenInfo(data))
      .catch((err) => console.error(err));

    fetch('http://localhost:3001/api/v1/total-supply')
      .then((res) => res.json())
      .then((data) => setSupply(data))
      .catch((err) => console.error(err));
    fetch('http://localhost:3001/api/v1/transaction-count')
      .then((res) => res.json())
      .then((data) => setTransactionCount(data))
      .catch((err) => console.error(err));
    fetch('http://localhost:3001/api/v1/transactions')
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error(err));
  }, []);

  const fetchBalance = () => {
    fetch(`http://localhost:3001/api/v1/balance/${walletAddress}`)
      .then((res) => res.json())
      .then((data) => setWalletBalance(data))
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ fontFamily: 'Arial', padding: '40px' }}>
      <h1>Dapp USD Dashboard</h1>

      <h2>System Health</h2>
      {health ? (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      ) : (
        <p>Loading health...</p>
      )}

      <h2>Token Info</h2>
      {tokenInfo ? (
        <pre>{JSON.stringify(tokenInfo, null, 2)}</pre>
      ) : (
        <p>Loading token info...</p>
      )}

      <h2>Total Supply</h2>
      {supply ? (
        <pre>{JSON.stringify(supply, null, 2)}</pre>
      ) : (
        <p>Loading total supply...</p>
      )}

      <h2>Wallet Balance Lookup</h2>
      <input
        type="text"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder="Enter wallet address"
        style={{ width: '500px', padding: '8px', marginRight: '10px' }}
      />
      <button onClick={fetchBalance} style={{ padding: '8px 12px' }}>
        Check Balance
      </button>

      {walletBalance && <pre>{JSON.stringify(walletBalance, null, 2)}</pre>}

      <h2>Indexed Transactions</h2>
      {transactionCount ? (
        <pre>{JSON.stringify(transactionCount, null, 2)}</pre>
      ) : (
        <p>Loading transaction count...</p>
      )}
      <h2>Transactions</h2>

      {transactions.length > 0 ? (
        <table border="1" cellPadding="10">
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
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.tx_hash.slice(0, 12)}...</td>
                <td>{tx.from_address}</td>
                <td>{tx.to_address}</td>
                <td>{tx.amount}</td>
                <td>{tx.block_number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Loading transactions...</p>
      )}
      {/* <h2>Transactions</h2>
      {transactions.length > 0 ? (
        <pre>{JSON.stringify(transactions, null, 2)}</pre>
      ) : (
        <p>Loading transactions...</p>
      )} */}
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
