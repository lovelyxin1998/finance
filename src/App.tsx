import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreatePool from './components/CreatePool';
import PoolFunds from './components/PoolFunds';
import ManagePool from './pages/ManagePool';
import WhitelistManager from './pages/WhitelistManager';
import UserBorrow from './pages/UserBorrow';
// import UpgradeContract from './pages/UpgradeContract'; // 已删除
import Authorize from './pages/Authorize';
import { TOKENS, LENDING_POOL_ADDRESS } from './constants/contracts';

const App = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<string>('');

  const checkAuthorization = async (provider: ethers.providers.Web3Provider) => {
    try {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
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

  const init = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        await checkAuthorization(provider);

        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }

        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          setAccount(accounts[0] || '');
          if (accounts.length > 0) {
            checkAuthorization(provider);
          } else {
            setIsAuthorized(false);
          }
        });
      }
    } catch (error) {
      console.error('初始化失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        <Navbar provider={provider} account={account} />
        <Box p={4}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/create-pool"
              element={
                !provider ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <CreatePool provider={provider} />
                )
              }
            />
            <Route
              path="/pool-funds"
              element={
                !provider ? (
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
                !provider ? (
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
                !provider ? (
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
                !provider ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <UserBorrow provider={provider} />
                )
              }
            />
            {/* <Route
              path="/upgrade-contract"
              element={
                !provider ? (
                  <Navigate to="/" replace />
                ) : (
                  <UpgradeContract provider={provider} />
                )
              }
            /> */}
            <Route
              path="/authorize"
              element={
                !provider ? (
                  <Navigate to="/" replace />
                ) : (
                  <Authorize onAuthorized={() => setIsAuthorized(true)} />
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
