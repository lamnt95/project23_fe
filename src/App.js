import React from 'react'

import BscDapp from '@obsidians/bsc-dapp'

import logo from './logo.svg';
import './App.css';

import abi from './coin.json'

const message = 'Hello Binance Smart Chain'

export default function App() {
  const dapp = React.useMemo(() => new BscDapp(), [])
  // const dapp = React.useMemo(() => new BscDapp({ extension: 'MetaMask' }), [])
  // const dapp = React.useMemo(() => new BscDapp({ extension: 'BinanceChainWallet' }), [])
  window.dapp = dapp

  const [enabled, setEnabled] = React.useState(dapp.isBrowserExtensionEnabled)
  const [account, setAccount] = React.useState(dapp.currentAddress)
  const [network, setNetwork] = React.useState()
  const [transferInfo, setTransferInfo] = React.useState({
    to: '',
    amount: '',
    txHash: ''
  })
  const [contractInfo, setContractInfo] = React.useState({
    address: '0xefaE5aaC09a8D0Ae946d13F4Af8b53BDdF8Bc9fA',
    receiver: '',
    amount: '1000',
    txHash: ''
  })
  const [sig, setSig] = React.useState('')

  React.useEffect(() => dapp.onEnabled(account => {
    setEnabled(true)
    setAccount(account)
    updateNetwork(dapp.network)
  }), [])

  React.useEffect(() => dapp.onNetworkChanged(result => {
    updateNetwork(result)
  }), [])


  React.useEffect(() => dapp.onAccountChanged(account => {
    setAccount(account)
  }), [])

  const updateNetwork = (network = {}) => {
    if (network.isBscMainnet) {
      setNetwork('Mainnet')
    } else if (network.isBscTestnet) {
      setNetwork('Testnet')
    } else {
      setNetwork()
    }
  }

  const signMessage = async () => {
    let sig
    if (dapp.browserExtension.name === 'MetaMask') {
      // Ref EIP-712, sign data that has a structure
      sig = await dapp.signTypedData([{ type: 'string', name: 'Message', value: message }])
    } else {
      // Binance Chain Wallet doesn't support signTypedData yet
      sig = await dapp.signMessage(message)
    }
    setSig(sig)
  }

  const transfer = async (to, amount) => {
    const tx = {
      from: account.address,
      to,
      value: dapp.parseEther(amount),
    };
    const txHash = await dapp.sendTransaction(tx)
    setTransferInfo({ ...transferInfo, txHash })
  }

  const execute = async () => {
    const { address, receiver, amount } = contractInfo
    const txParams = await dapp.executeContract({ address, abi }, 'mint', [receiver, amount])
    const txHash = await dapp.sendTransaction({
      from: account.address,
      value: dapp.parseEther('0'),
      ...txParams,
    })
    setContractInfo({ ...contractInfo, txHash })
  }

  let browserExtensionStatus
  let enableButton = null
  if (dapp.isBrowserExtensionInstalled) {
    if (!enabled) {
      enableButton = (
        <button className='btnConnect' onClick={() => dapp.enableBrowserExtension()}>
          Connect {dapp.browserExtension.name}
        </button>
      )
    }
  } else {
  }

  let accountInfo = null
  if (enabled && account) {
    accountInfo = (
      <span>
        {account.address}
        {/* <button onClick={() => getBalanceAndHistory()}>Get Balance and History</button> */}
      </span>
    )
  }

  // const getBalanceAndHistory = async () => {
  //   console.log("address: ", account.address)
  //   const balance = await dapp.rpc.getBalance(account.address)
  //   console.log('Balance:', balance.toString())

  //   const txs = await dapp.explorer.getHistory(account.address)
  //   console.log('TX History:', txs)
  // }

  let networkInfo = null
  if (enabled) {
    if (network) {
      networkInfo = <span>BSC {network}</span>
    } else {
      networkInfo = <span>Not connected to BSC Mainnet (<a target='_black' href='https://docs.binance.org/smart-chain/wallet/metamask.html'>Use BSC with Metamask</a>)</span>
    }
  }

  let signMessageButton = null
  // if (enabled && network) {
  //   signMessageButton = <div style={{ margin: '20px 0' }}>
  //     <div>message: <small><code>{message}</code></small></div>
  //     <div>signature: <small><code>{sig}</code></small></div>
  //     {!sig && <button onClick={() => signMessage()}>Sign Message</button>}
  //   </div>
  // }

  let transferForm = null
  if (enabled && network) {
    transferForm = <div style={{ margin: '20px 0' }}>
      <span className='mr10'>
        Transfer to
      </span>
      <span className='mr10'>
        <input
          value={transferInfo.to}
          onChange={(e) => setTransferInfo({ ...transferInfo, to: e.target.value })}
          placeholder="To"
        />
      </span>
      <span className='mr10'>
        amount
      </span>

      <span className='mr10'>
        <input
          value={transferInfo.amount}
          onChange={(e) => setTransferInfo({ ...transferInfo, amount: e.target.value })}
          placeholder="Amount"
        />
      </span>
      <span>
        <button onClick={() => transfer(transferInfo.to, transferInfo.amount)}>Transfer</button>
      </span>
      {
        !!transferInfo.txHash &&
        <div>{transferInfo.txHash}</div>
      }
    </div>
  }

  let contractForm = null
  if (enabled && network) {
    contractForm = <div style={{ margin: '20px 0' }}>
      <span className='mr10'>
        Mint to
      </span>
      <span className='mr10'>
        <input
          value={contractInfo.receiver}
          onChange={(e) => setContractInfo({ ...contractInfo, receiver: e.target.value })}
          placeholder="To"
        />
      </span>
      <span className='mr10'>
        amount:
      </span>
      <span className='mr10'>
        <input
          value={contractInfo.amount}
          onChange={(e) => setContractInfo({ ...contractInfo, amount: e.target.value })}
          placeholder="Amount"
        />
      </span>
      <span className='mr10'>
        <button onClick={() => execute()}>Mint</button>
      </span>
      {
        !!contractInfo.txHash &&
        <div>{contractInfo.txHash}</div>
      }
    </div>
  }

  return (
    <div className="App">
      <header className="App-header">

        <span>
          <span className='mr10'>
            Network:
          </span>
          <span className='mr10'>
            {networkInfo}
          </span>
        </span>

        <br />

        <span>
          <span className='mr10'>
            Contract
          </span>
          <span className='mr10'>
            {contractInfo.address}
          </span>
        </span>

        <br />


        <span>
          <span className='mr10'>
            Wallet
          </span>
          {accountInfo}
        </span>

        <br />

        {enableButton}
        {signMessageButton}
        {transferForm}
        {contractForm}
      </header>
    </div>
  );
}
