import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreatePool from './components/CreatePool';
import ModifyPool from './components/ModifyPool';
import PoolFunds from './components/PoolFunds';
import ManagePool from './pages/ManagePool';
import WhitelistManager from './pages/WhitelistManager';
import UserBorrow from './pages/UserBorrow';
import QueryData from './pages/QueryData';
import ClaimRewards from './pages/ClaimRewards';
import SubmitAddress from './pages/SubmitAddress';
import SpecificPoolBorrow from './pages/SpecificPoolBorrow';
import Authorize from './pages/Authorize';
import { TOKENS, LENDING_POOL_ADDRESS } from './constants/contracts';

const App = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 全局连接钱包方法
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('请先安装 MetaMask');
      return;
    }
    try {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      
      // 检查并切换到 BSC 链
      const chainId = await ethProvider.send('eth_chainId', []);
      const bscChainId = '0x38'; // BSC 主网 chainId
      
      if (chainId !== bscChainId) {
        try {
          await ethProvider.send('wallet_switchEthereumChain', [{ chainId: bscChainId }]);
        } catch (switchError: any) {
          // 如果 BSC 链未添加，则添加它
          if (switchError.code === 4902) {
            await ethProvider.send('wallet_addEthereumChain', [{
              chainId: bscChainId,
              chainName: 'Binance Smart Chain',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
              },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/']
            }]);
          } else {
            throw switchError;
          }
        }
      }
      
      await ethProvider.send('eth_requestAccounts', []);
      setProvider(ethProvider);
      const signer = ethProvider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      await checkAuthorization(ethProvider, address);
    } catch (e) {
      console.error('连接钱包失败:', e);
      alert('连接钱包失败');
    }
  };

  // 检查授权
  const checkAuthorization = async (provider: ethers.providers.Web3Provider, address?: string) => {
    try {
      if (!address) return; // 没有账户时不检查授权
      const signer = provider.getSigner();
      let allAuthorized = true;
      for (const token of TOKENS) {
        const contract = new ethers.Contract(token.address, token.abi, signer);
        const allowance = await contract.allowance(address, LENDING_POOL_ADDRESS);
        if (allowance.isZero()) {
          allAuthorized = false;
          break;
        }
      }
      setIsAuthorized(allAuthorized);
    } catch (error) {
      console.error('检查授权失败:', error);
      setIsAuthorized(false);
    }
  };

  // 自动检测已连接钱包
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      ethProvider.listAccounts().then(accounts => {
        if (accounts.length > 0) {
          setProvider(ethProvider);
          setAccount(accounts[0]);
          checkAuthorization(ethProvider, accounts[0]);
        }
      });
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || '');
        if (accounts.length > 0) {
          checkAuthorization(ethProvider, accounts[0]);
        } else {
          setIsAuthorized(false);
        }
      });
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        <Navbar account={account} connectWallet={connectWallet} />
        <Box p={4}>
          <Routes>
            <Route path="/" element={<Home provider={provider} account={account} />} />
            <Route
              path="/create-pool"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Navigate to="/authorize" replace />
                ) : (
                  <CreatePool provider={provider} />
                )
              }
            />
            <Route
              path="/modify-pool"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <ModifyPool provider={provider} />
                )
              }
            />
            <Route
              path="/pool-funds"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <PoolFunds provider={provider} />
                )
              }
            />
            <Route
              path="/manage-pool"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <ManagePool provider={provider} />
                )
              }
            />
            <Route
              path="/whitelist"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <WhitelistManager provider={provider} />
                )
              }
            />
            {/* 借款还款页面高亮 */}
            <Route
              path="/user-borrow"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <UserBorrow provider={provider} />
                )
              }
            />
            <Route
              path="/query-data"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <QueryData />
                )
              }
            />
            <Route
              path="/claim-rewards"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <ClaimRewards provider={provider} account={account} />
                )
              }
            />
            <Route
              path="/authorize"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                )
              }
            />
            <Route
              path="/submit-address"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <SubmitAddress account={account} />
                )
              }
            />
            <Route
              path="/specific-pool-borrow"
              element={
                !provider || !account ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <SpecificPoolBorrow provider={provider} account={account} />
                )
              }
            />
          </Routes>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default App;
