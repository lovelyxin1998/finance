import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { USDT_ADDRESS, USDT_ABI, LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from './constants/contracts';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ManagePool from './pages/ManagePool';
import Authorize from './pages/Authorize';
import CreatePool from './pages/CreatePool';
import WhitelistManager from './pages/WhitelistManager';
import UserBorrow from './pages/UserBorrow';

const App = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthorization = async (provider: ethers.providers.Web3Provider) => {
    try {
      const signer = provider.getSigner();
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
      const allowance = await usdtContract.allowance(await signer.getAddress(), LENDING_POOL_ADDRESS);
      setIsAuthorized(!allowance.isZero());
    } catch (error) {
      console.error('检查授权失败:', error);
      setIsAuthorized(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        await checkAuthorization(provider);

        window.ethereum.on('accountsChanged', async () => {
          await checkAuthorization(provider);
        });

        window.ethereum.on('chainChanged', async () => {
          await checkAuthorization(provider);
        });
      }
      setIsLoading(false);
    };

    init();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        <Navbar provider={provider} />
        <Box p={4}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/create-pool"
              element={
                !provider ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize provider={provider} onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <CreatePool provider={provider} />
                )
              }
            />
            <Route
              path="/manage-pool"
              element={
                !provider ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize provider={provider} onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <ManagePool />
                )
              }
            />
            <Route
              path="/whitelist"
              element={
                !provider ? (
                  <Navigate to="/" replace />
                ) : !isAuthorized ? (
                  <Authorize provider={provider} onAuthorized={() => setIsAuthorized(true)} />
                ) : (
                  <WhitelistManager />
                )
              }
            />
            <Route
              path="/user-borrow"
              element={
                !provider ? (
                  <Navigate to="/" replace />
                ) : (
                  <UserBorrow provider={provider} />
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
