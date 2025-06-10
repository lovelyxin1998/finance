import React, { useState } from 'react';
import { ethers } from 'ethers';
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../constants/contracts';

interface Props {
  provider: ethers.providers.Web3Provider | null;
}

const PoolFunds: React.FC<Props> = ({ provider }) => {
  const [poolId, setPoolId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleAdd = async () => {
    if (!provider) return setStatus('请先连接钱包');
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
      const tx = await contract.addFunds(
        ethers.BigNumber.from(poolId),
        ethers.BigNumber.from(amount)
      );
      setStatus('存入中...');
      await tx.wait();
      setStatus('存入成功！');
    } catch (e: any) {
      setStatus('失败: ' + (e.message || e));
    }
  };

  const handleWithdraw = async () => {
    if (!provider) return setStatus('请先连接钱包');
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
      const tx = await contract.withdrawFunds(
        ethers.BigNumber.from(poolId),
        ethers.BigNumber.from(amount)
      );
      setStatus('取出中...');
      await tx.wait();
      setStatus('取出成功！');
    } catch (e: any) {
      setStatus('失败: ' + (e.message || e));
    }
  };

  return (
    <div style={{border: '1px solid #eee', padding: 16, marginBottom: 16}}>
      <h3>资金池存入/取出</h3>
      <div>池ID: <input value={poolId} onChange={e => setPoolId(e.target.value)} /></div>
      <div>金额: <input value={amount} onChange={e => setAmount(e.target.value)} /></div>
      <button onClick={handleAdd}>存入资金</button>
      <button onClick={handleWithdraw} style={{marginLeft: 8}}>取出资金</button>
      <div>{status}</div>
    </div>
  );
};

export default PoolFunds; 