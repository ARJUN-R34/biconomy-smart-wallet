/* eslint-disable array-callback-return */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import './App.css';
import { ethers } from 'ethers';
import { BiconomySmartAccount, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account";
import { Bundler } from '@biconomy/bundler';
import { BiconomyPaymaster } from '@biconomy/paymaster';

import { erc20ABI } from './ABI';
import Constants from './constants';

window.Buffer = require('buffer/').Buffer;

function App() {
  const [eoa, setEoa] = useState(null);
  const [rpcUrl, setRpcUrl] = useState(null);
  const [bundlerUrl, setBundlerUrl] = useState(null);
  const [paymasterUrl, setPaymasterUrl] = useState(null);
  const [network, setNetwork] = useState(null);
  const [networkName, setNetworkName] = useState(null);
  const [nativeAsset, setNativeAsset] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [smartAccount, setSmartAccount] = useState(null);
  const [smartAccountInstance, setSmartAccountInstance] = useState(null);
  const [maticAddress, setMaticAddress] = useState(null);
  const [wmaticAddress, setWMaticAddress] = useState(null);
  const [maticAmount, setMaticAmount] = useState(null);
  const [wmaticAmount, setWMaticAmount] = useState(null);
  const [maticTransferHash, setMaticTransferHash] = useState(null);
  const [wmaticTransferHash, setWMaticTransferHash] = useState(null);
  const [wrappedAssetAddress, setWrappedAssetAddress] = useState(null);
  const [wrappedAsset, setWrappedAsset] = useState(null);
  const [supportedTokens, setSupportedTokens] = useState([]);
  const [batchMaticAddress, setBatchMaticAddress] = useState(null);
  const [batchMaticAmount, setBatchMaticAmount] = useState(null);
  const [batchWMaticAddress, setBatchWMaticAddress] = useState(null);
  const [batchWMaticAmount, setBatchWMaticAmount] = useState(null);
  const [batchTransferHash, setBatchTransferHash] = useState(null);
  const [maticBalance, setMaticBalance] = useState(null);
  const [wmaticBalance, setWMaticBalance] = useState(null);

  useEffect(() => {
    setDefaultConfigs();
  }, []);

  useEffect(() => {
    if (bundlerUrl && chainId && rpcUrl && paymasterUrl) {
      setDefaultAccountDetails();
    }
  }, [bundlerUrl, chainId, rpcUrl, paymasterUrl])

  const setDefaultAccountDetails = () => {
    const privateKey = localStorage.getItem('privateKey');

    if (!privateKey) {
      generateEOA();
    } else {
      const eoa = new ethers.Wallet(privateKey);
      setEoa(eoa.address);
      getSmartWalletAddress(eoa);
    }
  }

  const setDefaultConfigs = () => {
    const network = localStorage.getItem('network');

    setChainId(network ? Constants[network].chainId : Constants['POLYGON_MUMBAI'].chainId);
    setRpcUrl(network ? Constants[network].rpcUrl : Constants['POLYGON_MUMBAI'].rpcUrl);
    setBundlerUrl(network ? Constants[network].bundlerUrl : Constants['POLYGON_MUMBAI'].bundlerUrl);
    setPaymasterUrl(network ? Constants[network].paymasterUrl : Constants['POLYGON_MUMBAI'].paymasterUrl);
    setNetwork(network ? Constants[network].networkName : Constants['POLYGON_MUMBAI'].networkName);
    setNetworkName(network ? Constants[network].name : Constants['POLYGON_MUMBAI'].name);
    setNativeAsset(network ? Constants[network].nativeAsset : Constants['POLYGON_MUMBAI'].nativeAsset);
    setWrappedAsset(network ? Constants[network].wrappedAsset : Constants['POLYGON_MUMBAI'].wrappedAsset);
    setWrappedAssetAddress(network ? Constants[network].wrappedAssetAddress : Constants['POLYGON_MUMBAI'].wrappedAssetAddress);

    localStorage.setItem('network', network ? network : Constants['POLYGON_MUMBAI'].name);
  }

  const generateEOA = async () => {
    const eoa = ethers.Wallet.createRandom();

    setEoa(eoa.address);
    localStorage.setItem('privateKey', eoa.privateKey);
    localStorage.setItem('eoa', eoa.address);

    await getSmartWalletAddress(eoa)
  }

  const getSmartWalletAddress = async (signer) => {
    setSmartAccount('...');

    const bundler = new Bundler({ bundlerUrl, chainId, entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS });
    const paymaster = new BiconomyPaymaster({ paymasterUrl });

    const smartAccountConfig = { signer, chainId, rpcUrl, bundler, paymaster };

    const account = new BiconomySmartAccount(smartAccountConfig);
    const smartAccount = await account.init();
    const smartAccountAddress = await smartAccount.getSmartAccountAddress();

    setSmartAccountInstance(smartAccount);
    setSmartAccount(smartAccount.address);
    localStorage.setItem('smartAccount', smartAccountAddress);
  }

  const sendMatic = async () => {
    setMaticTransferHash('...');

    const to = maticAddress;
    const value = maticAmount;

    const transaction = { to, value };

    const partialUserOp = await smartAccountInstance.buildUserOp([transaction]);

    const paymaster = smartAccountInstance.paymaster;

    const feeQuotesResponse = await paymaster.getPaymasterFeeQuotesOrData(partialUserOp, { mode: 'ERC20', tokenList: [wrappedAssetAddress] });
    const requiredFeeQuotes = feeQuotesResponse.feeQuotes[0];
    const spender = feeQuotesResponse.tokenPaymasterAddress || '';

    const finalUserOp = await smartAccountInstance.buildTokenPaymasterUserOp(partialUserOp, { feeQuote: requiredFeeQuotes, spender, maxApproval: false });

    let paymasterServiceData = { mode: 'ERC20', feeTokenAddress: requiredFeeQuotes.tokenAddress };

    const paymasterAndDataWithLimits = await paymaster.getPaymasterAndData(finalUserOp, paymasterServiceData);
    finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;

    const userOpResponse = await smartAccountInstance.sendUserOp(finalUserOp);
    const transactionDetails = await userOpResponse.wait();

    setMaticTransferHash(transactionDetails.receipt.transactionHash);
  }

  const sendWMatic = async () => {
    setWMaticTransferHash('...');

    const to = wrappedAssetAddress;

    const contract = new ethers.utils.Interface(erc20ABI);
    const data = contract.encodeFunctionData('transfer', [wmaticAddress, wmaticAmount]);

    const transaction = { to, data };

    const partialUserOp = await smartAccountInstance.buildUserOp([transaction]);

    const paymaster = smartAccountInstance.paymaster;

    const feeQuotesResponse = await paymaster.getPaymasterFeeQuotesOrData(partialUserOp, { mode: 'ERC20', tokenList: [wrappedAssetAddress] });
    const requiredFeeQuotes = feeQuotesResponse.feeQuotes[0];
    const spender = feeQuotesResponse.tokenPaymasterAddress || '';

    const finalUserOp = await smartAccountInstance.buildTokenPaymasterUserOp(partialUserOp, { feeQuote: requiredFeeQuotes, spender, maxApproval: false });

    let paymasterServiceData = { mode: 'ERC20', feeTokenAddress: requiredFeeQuotes.tokenAddress };

    const paymasterAndDataWithLimits = await paymaster.getPaymasterAndData(finalUserOp, paymasterServiceData);
    finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;

    const userOpResponse = await smartAccountInstance.sendUserOp(finalUserOp);
    const transactionDetails = await userOpResponse.wait();

    setWMaticTransferHash(transactionDetails.receipt.transactionHash);
  }

  const supportedTokensForGas = async () => {
    setSupportedTokens('...');

    const to = '0x2723A2756ecb99b3B50f239782876fB595728AC0';
    const value = '10000000000';
    const transaction = { to, value };

    const userOp = await smartAccountInstance.buildUserOp([transaction]);

    const paymaster = smartAccountInstance.paymaster;
    const feeQuotesResponse = await paymaster.getPaymasterFeeQuotesOrData(userOp, { mode: 'ERC20', tokenList: [] });

    let supportedTokens = [];

    feeQuotesResponse.feeQuotes.map((token) => {
      const tokenObj = { symbol: token.symbol, tokenAddress: token.tokenAddress };

      return supportedTokens.push(tokenObj);
    });

    setSupportedTokens(supportedTokens);
  }

  const sendBatch = async () => {
    setBatchTransferHash('...');

    const transactions = [];

    const tx1To = batchMaticAddress;
    const tx1Value = batchMaticAmount;
    const transaction1 = { to: tx1To, value: tx1Value };
    transactions.push(transaction1);

    const tx2To = batchWMaticAddress;
    const tx2Value = batchWMaticAmount;
    const contract = new ethers.utils.Interface(erc20ABI);
    const data = contract.encodeFunctionData('transfer', [tx2To, tx2Value]);
    const transaction2 = { to: wrappedAssetAddress, data };
    transactions.push(transaction2);

    const partialUserOp = await smartAccountInstance.buildUserOp(transactions);

    const paymaster = smartAccountInstance.paymaster;

    const feeQuotesResponse = await paymaster.getPaymasterFeeQuotesOrData(partialUserOp, { mode: 'ERC20', tokenList: [wrappedAssetAddress] });
    const requiredFeeQuotes = feeQuotesResponse.feeQuotes[0];
    const spender = feeQuotesResponse.tokenPaymasterAddress || '';

    const finalUserOp = await smartAccountInstance.buildTokenPaymasterUserOp(partialUserOp, { feeQuote: requiredFeeQuotes, spender, maxApproval: false });

    let paymasterServiceData = { mode: 'ERC20', feeTokenAddress: requiredFeeQuotes.tokenAddress };

    const paymasterAndDataWithLimits = await paymaster.getPaymasterAndData(finalUserOp, paymasterServiceData);
    finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;

    const userOpResponse = await smartAccountInstance.sendUserOp(finalUserOp);
    const transactionDetails = await userOpResponse.wait();

    setBatchTransferHash(transactionDetails.receipt.transactionHash);
  }

  const getBalance = async (asset) => {
    let provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    if (asset === 'matic') {
      setMaticBalance('...');
      const balance = await provider.getBalance(smartAccount);
      setMaticBalance(ethers.utils.formatEther(balance));
    } else {
      setWMaticBalance('...');
      const contract = new ethers.Contract(wrappedAssetAddress, erc20ABI, provider);
      const balance = await contract.balanceOf(smartAccount);
      setWMaticBalance(ethers.utils.formatEther(balance));
    }
  }

  const getSupportedNetworks = () => {
    const networkName = Object.keys(Constants);

    let response = [];

    // eslint-disable-next-line array-callback-return
    networkName.map((network) => {
      const networkDetails = Constants[network];

      const networkObj = {
        label: networkDetails.networkName,
        value: networkDetails.name,
      };

      response.push(networkObj);
    });

    return response;
  }

  const setChainNetwork = async (networkName) => {
    const networkDetails = Constants[networkName.value];

    setRpcUrl(networkDetails.rpcUrl);
    setBundlerUrl(networkDetails.bundlerUrl);
    setPaymasterUrl(networkDetails.paymasterUrl);
    setNetwork(networkDetails.networkName);
    setNativeAsset(networkDetails.nativeAsset);
    setChainId(networkDetails.chainId);
    setWrappedAsset(networkDetails.wrappedAsset);
    setWrappedAssetAddress(networkDetails.wrappedAssetAddress);
    setNetworkName(networkDetails.name);

    window.location.reload();

    const privateKey = localStorage.getItem('privateKey');
    const eoa = new ethers.Wallet(privateKey);

    localStorage.setItem('network', networkName.value);
    await getSmartWalletAddress(eoa);
  }

  return (
    <>
      {/* Header */}
      <header>
        <div id='logo-container'>
          <h2 id='logo-text' className='text-center'>
            Smart Wallet | Biconomy
          </h2>
        </div>
      </header>

      <hr className='solid'></hr>

      {/* Status Tab */}
      <section className='status-tab'>
        <div className='row'>
          <div className='col-sm-6'>
            <p className='info-text alert alert-primary'>
              Owner: <span id='owner'> {eoa || null} </span>
            </p>
          </div>

          <div className='col-sm-6'>
            <p className='info-text alert alert-primary'>
              Smart Wallet: <span id='accounts'> {smartAccount} </span>
            </p>
          </div>

          <div className='col-sm-6'>
            <div className='info-text alert alert-success'>
              <Select
                options={getSupportedNetworks()}
                value={network}
                onInputChange={() => { }}
                onChange={setChainNetwork}
                placeholder={network}
              />
            </div>
          </div>

          <div className='col-sm-6'>
            <p className='info-text alert alert-success'>
              Network: <span id='network'> {network} </span>
            </p>
          </div>
        </div>
      </section>

      <hr className='solid'></hr>

      {/* Generate EOA */}
      <section>
        <div>
          <div className='row d-flex justify-content-center'>

            <div className='col-lg-6'>
              <div className='card'>
                <div className='card-body'>

                  <button
                    className='btn btn-primary btn-lg btn-block mb-3'
                    id='registerDevice'
                    disabled={!smartAccount || smartAccount === '...'}
                    onClick={() => { generateEOA() }}
                  >
                    Generate EOA
                  </button>

                  <p className='info-text alert alert-secondary'>
                    <span> Response: {eoa ? 'Wallet generated successfully' : null} </span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <hr className='solid'></hr>

      {/* List of supported Tokens */}
      <section>
        <div>
          <div className='row d-flex justify-content-center'>

            <div className='col-lg-6'>
              <div className='card'>
                <div className='card-body'>
                  <h4 className='card-title'>
                    List of supported tokens for gas
                  </h4>

                  <hr className='solid'></hr>

                  <button
                    className='btn btn-primary btn-lg btn-block mb-3'
                    id='registerDevice'
                    disabled={!smartAccount || smartAccount === '...' || supportedTokens === '...'}
                    onClick={() => { supportedTokensForGas(); }}
                  >
                    Submit
                  </button>

                  <p className='info-text alert alert-secondary'>
                    <span> Response: {supportedTokens === '...' ? supportedTokens : JSON.stringify(supportedTokens)} </span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <hr className='solid'></hr>

      {/* Get Balance */}
      <section>
        <div>
          <div className='row'>

            <div className='col-lg-6'>
              <div className='card'>
                <div className='card-body'>

                  <button
                    className='btn btn-primary btn-lg btn-block mb-3'
                    id='registerDevice'
                    disabled={!smartAccount || smartAccount === '...' || maticBalance === '...'}
                    onClick={() => { getBalance('matic') }}
                  >
                    Get {nativeAsset} Balance (Smart Wallet)
                  </button>

                  <p className='info-text alert alert-secondary'>
                    <span> Response: {maticBalance} </span>
                  </p>
                </div>
              </div>
            </div>

            <div className='col-lg-6'>
              <div className='card'>
                <div className='card-body'>

                  <button
                    className='btn btn-primary btn-lg btn-block mb-3'
                    id='registerDevice'
                    disabled={!smartAccount || smartAccount === '...' || wmaticBalance === '...'}
                    onClick={() => { getBalance('wmatic') }}
                  >
                    Get {wrappedAsset} Balance (Smart Wallet)
                  </button>

                  <p className='info-text alert alert-secondary'>
                    <span> Response: {wmaticBalance} </span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <hr className='solid'></hr>

      {/* Send MATIC and Wrapped Asset */}
      <section>
        <div>
          <div className='row'>

            {/* MATIC Transaction */}
            <div className='col-sm-6'>
              <div className='card'>
                <div className='card-body'>
                  <h4 className='card-title'>
                    {nativeAsset} Transaction (gas paid in {wrappedAsset})
                  </h4>

                  <hr className='solid'></hr>

                  <div className='form-group'>
                    <label> <strong> Recipient address </strong></label>
                    <input
                      className='form-control'
                      type='text'
                      placeholder='0x...'
                      id='name'
                      onChange={(e) => { ethers.utils.isAddress(e.target.value) ? setMaticAddress(e.target.value) : setMaticAddress(null); }}
                    />
                  </div>

                  <div className='form-group'>
                    <label> <strong> Amount </strong></label>
                    <input
                      className='form-control'
                      type='text'
                      placeholder='1.23'
                      id='name'
                      onChange={(e) => { const amount = e.target.value ? ethers.utils.parseEther(e.target.value) : null; setMaticAmount(amount?.toString()); }}
                    />
                  </div>

                  <button
                    className='btn btn-primary btn-lg btn-block mb-3'
                    id='sendMatic'
                    disabled={!maticAddress || !maticAmount || maticTransferHash === '...'}
                    onClick={() => { sendMatic(); }}
                  >
                    {(maticTransferHash === '...') ? 'Transaction in progress...' : `Send ${nativeAsset}`}
                  </button>

                  <p className='info-text alert alert-secondary'>
                    <span> Transaction Hash: {maticTransferHash} </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Wrapped Asset Transaction */}
            <div className='col-sm-6'>
              <div className='card'>
                <div className='card-body'>
                  <h4 className='card-title'>
                    {wrappedAsset} Transaction (gas paid in {wrappedAsset})
                  </h4>

                  <hr className='solid'></hr>

                  <div className='form-group'>
                    <label> <strong> Recipient address </strong></label>
                    <input
                      className='form-control'
                      type='text'
                      placeholder='0x...'
                      id='name'
                      onChange={(e) => { ethers.utils.isAddress(e.target.value) ? setWMaticAddress(e.target.value) : setWMaticAddress(null); }}
                    />
                  </div>

                  <div className='form-group'>
                    <label> <strong> Amount </strong></label>
                    <input
                      className='form-control'
                      type='text'
                      placeholder='1.23'
                      id='name'
                      onChange={(e) => { const amount = e.target.value ? ethers.utils.parseEther(e.target.value) : null; setWMaticAmount(amount?.toString()); }}
                    />
                  </div>

                  <button
                    className='btn btn-primary btn-lg btn-block mb-3'
                    id='registerDevice'
                    disabled={!wmaticAddress || !wmaticAmount || wmaticTransferHash === '...'}
                    onClick={() => { sendWMatic(); }}
                  >
                    {(wmaticTransferHash === '...') ? 'Transaction in progress...' : `Send ${wrappedAsset}`}
                  </button>

                  <p className='info-text alert alert-secondary'>
                    <span> Transaction Hash: {wmaticTransferHash} </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className='solid'></hr>

      {/* Batch Transactions */}
      <section>
        <div className='row d-flex justify-content-center'>
          <div className='col-lg-6'>
            <div className='card'>
              <div className='card-body'>
                <h4 className='card-title'>
                  Batch Transaction ({nativeAsset} + {wrappedAsset} - gas paid in {wrappedAsset})
                </h4>

                <hr className='solid'></hr>

                <div className='form-group'>
                  <label> <strong> {nativeAsset} recipient address </strong></label>
                  <input
                    className='form-control'
                    type='text'
                    placeholder='0x...'
                    id='name'
                    onChange={(e) => { ethers.utils.isAddress(e.target.value) ? setBatchMaticAddress(e.target.value) : setBatchMaticAddress(null); }}
                  />
                </div>

                <div className='form-group'>
                  <label> <strong> {nativeAsset} Amount </strong></label>
                  <input
                    className='form-control'
                    type='text'
                    placeholder='1.23'
                    id='name'
                    onChange={(e) => { const amount = e.target.value ? ethers.utils.parseEther(e.target.value) : null; setBatchMaticAmount(amount?.toString()); }}
                  />
                </div>

                <hr className='solid'></hr>

                <div className='form-group'>
                  <label> <strong> {wrappedAsset} recipient address </strong></label>
                  <input
                    className='form-control'
                    type='text'
                    placeholder='0x...'
                    id='name'
                    onChange={(e) => { ethers.utils.isAddress(e.target.value) ? setBatchWMaticAddress(e.target.value) : setBatchWMaticAddress(null); }}
                  />
                </div>

                <div className='form-group'>
                  <label> <strong> {wrappedAsset} Amount </strong></label>
                  <input
                    className='form-control'
                    type='text'
                    placeholder='1.23'
                    id='name'
                    onChange={(e) => { const amount = e.target.value ? ethers.utils.parseEther(e.target.value) : null; setBatchWMaticAmount(amount?.toString()); }}
                  />
                </div>

                <button
                  className='btn btn-primary btn-lg btn-block mb-3'
                  id='sendMatic'
                  disabled={!batchMaticAddress || !batchMaticAmount || !batchWMaticAddress || !batchWMaticAmount || batchTransferHash === '...'}
                  onClick={() => { sendBatch(); }}
                >
                  {(batchTransferHash === '...') ? 'Transaction in progress...' : 'Send Batch'}
                </button>

                <p className='info-text alert alert-secondary'>
                  <span> Transaction Hash: {batchTransferHash} </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className='solid'></hr>

      <p> Powered by <a href="https://www.biconomy.io/">Biconomy</a> </p>

    </>
  );
}

export default App;