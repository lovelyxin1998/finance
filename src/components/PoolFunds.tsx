import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI, TOKENS } from '../constants/contracts';

interface Props {
  provider: ethers.providers.Web3Provider | null;
}

interface PoolInfo {
  creator: string;
  maxBorrowAmount: ethers.BigNumber;
  totalFunds: ethers.BigNumber;
  totalBorrowed: ethers.BigNumber;
  name: string;
  creatorFeeRate: ethers.BigNumber;
  borrowToken: string;
}

const PoolFunds: React.FC<Props> = ({ provider }) => {
  const [poolId, setPoolId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 获取资金池信息
  const fetchPoolInfo = async (id: string) => {
    if (!provider || !id) return;
    
    try {
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, provider);
      const [pool] = await contract.getPoolInfo(id);
      setPoolInfo(pool);
    } catch (error) {
      console.error('获取资金池信息失败:', error);
      setPoolInfo(null);
    }
  };

  // 当池ID变化时获取信息
  useEffect(() => {
    if (poolId) {
      fetchPoolInfo(poolId);
    } else {
      setPoolInfo(null);
    }
  }, [poolId, provider]);

  const handleAdd = async () => {
    if (!provider) return setStatus('请先连接钱包');
    if (!poolId || !amount || !poolInfo) {
      return setStatus('请填写池ID和金额，并确保资金池存在');
    }

    setIsLoading(true);
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
      
      // 检查用户是否是资金池创建者
      const address = await signer.getAddress();
      if (address.toLowerCase() !== poolInfo.creator.toLowerCase()) {
        setStatus('只有资金池创建者可以添加资金');
        return;
      }

      // 检查代币授权
      const tokenContract = new ethers.Contract(poolInfo.borrowToken, TOKENS[0].abi, signer);
      const allowance = await tokenContract.allowance(address, LENDING_POOL_ADDRESS);
      const amountWei = ethers.utils.parseUnits(amount, 18);
      
      if (allowance.lt(amountWei)) {
        setStatus('请先授权足够的代币给合约');
        return;
      }

      const tx = await contract.addFunds(
        ethers.BigNumber.from(poolId),
        amountWei
      );
      setStatus('存入中...');
      await tx.wait();
      setStatus('存入成功！');
      
      // 刷新资金池信息
      await fetchPoolInfo(poolId);
    } catch (e: any) {
      console.error('存入资金失败:', e);
      setStatus('失败: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!provider) return setStatus('请先连接钱包');
    if (!poolId || !amount || !poolInfo) {
      return setStatus('请填写池ID和金额，并确保资金池存在');
    }

    setIsLoading(true);
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
      
      // 检查用户是否是资金池创建者
      const address = await signer.getAddress();
      if (address.toLowerCase() !== poolInfo.creator.toLowerCase()) {
        setStatus('只有资金池创建者可以取出资金');
        return;
      }

      const amountWei = ethers.utils.parseUnits(amount, 18);
      const tx = await contract.withdrawFunds(
        ethers.BigNumber.from(poolId),
        amountWei
      );
      setStatus('取出中...');
      await tx.wait();
      setStatus('取出成功！');
      
      // 刷新资金池信息
      await fetchPoolInfo(poolId);
    } catch (e: any) {
      console.error('取出资金失败:', e);
      setStatus('失败: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  // 获取代币符号
  const getTokenSymbol = (tokenAddress: string) => {
    const token = TOKENS.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    return token ? token.symbol : 'Unknown';
  };

  return (
    <div style={{border: '1px solid #eee', padding: 16, marginBottom: 16}}>
      <h3>资金池存入/取出</h3>
      <div>池ID: <input value={poolId} onChange={e => setPoolId(e.target.value)} placeholder="请输入资金池ID" /></div>
      <div>金额 (Ether): <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="请输入金额（Ether）" /></div>
      
      {poolInfo && (
        <div style={{marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4}}>
          <h4>资金池信息:</h4>
          <div>名称: {poolInfo.name}</div>
          <div>创建者: {poolInfo.creator}</div>
          <div>借款代币: {getTokenSymbol(poolInfo.borrowToken)} ({poolInfo.borrowToken})</div>
          <div>总资金: {ethers.utils.formatUnits(poolInfo.totalFunds, 18)} {getTokenSymbol(poolInfo.borrowToken)}</div>
          <div>已借出: {ethers.utils.formatUnits(poolInfo.totalBorrowed, 18)} {getTokenSymbol(poolInfo.borrowToken)}</div>
        </div>
      )}
      
      <div style={{marginTop: 16}}>
        <button onClick={handleAdd} disabled={isLoading || !poolInfo}>
          {isLoading ? '处理中...' : '存入资金'}
        </button>
        <button onClick={handleWithdraw} disabled={isLoading || !poolInfo} style={{marginLeft: 8}}>
          {isLoading ? '处理中...' : '取出资金'}
        </button>
      </div>
      <div style={{marginTop: 8, color: status.includes('失败') ? 'red' : 'green'}}>{status}</div>
    </div>
  );
};

export default PoolFunds; 