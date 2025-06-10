import React, { useState } from 'react';
import { ethers } from 'ethers';

interface WalletConnectProps {
  onConnect: (provider: ethers.providers.Web3Provider, address: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [address, setAddress] = useState<string>('');
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      // 请求用户切换到 BSC 链，chainId 为 56
      const chainId = 56;
      const rpcUrl = 'https://bsc-dataseed.binance.org/';
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(chainId) }],
        });
      } catch (switchError: any) {
        // 如果 BSC 链未添加，则添加 BSC 链
         if (switchError.code === 4902) {
           await (window as any).ethereum.request({
             method: 'wallet_addEthereumChain',
             params: [{
               chainId: ethers.utils.hexValue(chainId),
               chainName: 'BSC Mainnet',
               nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
               rpcUrls: [rpcUrl],
               blockExplorerUrls: ['https://bscscan.com']
             }]
           });
         } else {
           throw switchError;
         }
      }
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      setConnected(true);
      onConnect(provider, addr);
    } else {
      alert('请先安装 MetaMask 钱包');
    }
  };

  return (
    <div>
      {connected ? (
        <div>已连接: {address}</div>
      ) : (
        <button onClick={connectWallet}>连接钱包</button>
      )}
    </div>
  );
};

export default WalletConnect; 