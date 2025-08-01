import React, { useState } from 'react';
import { ethers } from 'ethers';
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI, TOKENS } from '../constants/contracts';

interface Props {
  provider: ethers.providers.Web3Provider | null;
}

const CreatePool: React.FC<Props> = ({ provider }) => {
  const [poolId, setPoolId] = useState('');
  const [maxBorrow, setMaxBorrow] = useState('');
  const [name, setName] = useState('');
  const [feeRate, setFeeRate] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0].address); // 默认选择第一个代币
  const [status, setStatus] = useState('');

  const handleCreate = async () => {
    if (!provider) return setStatus('请先连接钱包');
    if (!poolId || !maxBorrow || !name || !feeRate) {
      return setStatus('请填写所有必填字段');
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
      // 将最大借款额度从 Ether 转换为 Wei
      const maxBorrowWei = ethers.utils.parseUnits(maxBorrow, 18);
      const tx = await contract.createPool(
        ethers.BigNumber.from(poolId),
        maxBorrowWei,
        name,
        ethers.BigNumber.from(feeRate),
        selectedToken
      );
      setStatus('交易发送中...');
      await tx.wait();
      setStatus('资金池创建成功！');
    } catch (e: any) {
      setStatus('失败: ' + (e.message || e));
    }
  };

  return (
    <div style={{border: '1px solid #eee', padding: 16, marginBottom: 16}}>
      <h3>创建资金池</h3>
      <div>池ID: <input value={poolId} onChange={e => setPoolId(e.target.value)} /></div>
      <div>
        最大借款额度（单位：Ether）:
        <input
          value={maxBorrow}
          onChange={e => setMaxBorrow(e.target.value)}
          placeholder="请输入最大借款额度（Ether）"
        />
      </div>
      <div>池名称: <input value={name} onChange={e => setName(e.target.value)} /></div>
      <div>手续费比例（百万分之一）: <input value={feeRate} onChange={e => setFeeRate(e.target.value)} /></div>
      <div>
        借款代币:
        <select value={selectedToken} onChange={e => setSelectedToken(e.target.value)}>
          {TOKENS.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} ({token.address})
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleCreate}>创建资金池</button>
      <div>{status}</div>
    </div>
  );
};

export default CreatePool; 