import React, { useState } from 'react';
import { ethers } from 'ethers';
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../constants/contracts';

interface Props {
  provider: ethers.providers.Web3Provider | null;
}

const WhitelistManager: React.FC<Props> = ({ provider }) => {
  const [poolId, setPoolId] = useState('');
  const [userAddrText, setUserAddrText] = useState('');
  const [removeAddrText, setRemoveAddrText] = useState('');
  const [status, setStatus] = useState('');

  const handleAdd = async () => {
    if (!provider) return setStatus('请先连接钱包');
    const users = userAddrText.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (users.length === 0) return setStatus('请输入至少一个地址');
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
      const tx = await contract.addToWhitelist(ethers.BigNumber.from(poolId), users);
      setStatus('添加白名单中...');
      await tx.wait();
      setStatus('添加白名单成功！');
    } catch (e: any) {
      setStatus('失败: ' + (e.message || e));
    }
  };

  const handleRemove = async () => {
    if (!provider) return setStatus('请先连接钱包');
    const users = removeAddrText.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (users.length === 0) return setStatus('请输入至少一个待移除的地址');
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
      const tx = await contract.removeFromWhitelist(ethers.BigNumber.from(poolId), users);
      setStatus('移除白名单中...');
      await tx.wait();
      setStatus('移除白名单成功！');
    } catch (e: any) {
      setStatus('失败: ' + (e.message || e));
    }
  };

  return (
    <div style={{border: '1px solid #eee', padding: 16, marginBottom: 16}}>
      <h3>白名单管理</h3>
      <div>池ID: <input value={poolId} onChange={e => setPoolId(e.target.value)} /></div>
      <div>用户地址（每行一个）: <textarea value={userAddrText} onChange={e => setUserAddrText(e.target.value)} rows={5} cols={40} /></div>
      <button onClick={handleAdd}>添加白名单</button>
      <div style={{marginTop: 16}}>移除白名单地址（每行一个）: <textarea value={removeAddrText} onChange={e => setRemoveAddrText(e.target.value)} rows={5} cols={40} /></div>
      <button onClick={handleRemove} style={{marginLeft: 8}}>移除白名单</button>
      <div>{status}</div>
    </div>
  );
};

export default WhitelistManager; 