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

const ModifyPool: React.FC<Props> = ({ provider }) => {
  const [poolId, setPoolId] = useState('');
  const [maxBorrow, setMaxBorrow] = useState('');
  const [name, setName] = useState('');
  const [feeRate, setFeeRate] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

  // 获取资金池信息
  const fetchPoolInfo = async (id: string) => {
    if (!provider || !id) return;
    
    try {
      setIsLoading(true);
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, provider);
      const [pool, addressListLength] = await contract.getPoolInfo(id);
      
      setPoolInfo(pool);
      
      // 填充表单字段
      setMaxBorrow(ethers.utils.formatUnits(pool.maxBorrowAmount, 18));
      setName(pool.name);
      setFeeRate(pool.creatorFeeRate.toString());
      setSelectedToken(pool.borrowToken);
      
      setStatus(`资金池信息加载成功，白名单用户数量: ${addressListLength}`);
    } catch (error) {
      console.error('获取资金池信息失败:', error);
      setStatus('获取资金池信息失败，请检查池ID是否正确');
      setPoolInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 当池ID变化时自动获取信息
  useEffect(() => {
    if (poolId) {
      fetchPoolInfo(poolId);
    } else {
      setPoolInfo(null);
      setMaxBorrow('');
      setName('');
      setFeeRate('');
      setSelectedToken('');
    }
  }, [poolId, provider]);

  const handleModify = async () => {
    if (!provider) return setStatus('请先连接钱包');
    if (!poolId || !maxBorrow || !name || !feeRate || !selectedToken) {
      return setStatus('请填写所有必填字段');
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
      
      // 将最大借款额度从 Ether 转换为 Wei
      const maxBorrowWei = ethers.utils.parseUnits(maxBorrow, 18);
      
      const tx = await contract.modifierPoolData(
        ethers.BigNumber.from(poolId),
        maxBorrowWei,
        name,
        ethers.BigNumber.from(feeRate),
        selectedToken
      );
      
      setStatus('交易发送中...');
      await tx.wait();
      setStatus('资金池参数修改成功！');
      
      // 重新获取更新后的信息
      await fetchPoolInfo(poolId);
    } catch (e: any) {
      setStatus('失败: ' + (e.message || e));
    }
  };

  return (
    <div style={{border: '1px solid #eee', padding: 16, marginBottom: 16}}>
      <h3>修改资金池参数</h3>
      
      <div>
        <label>池ID (必填): </label>
        <input 
          value={poolId} 
          onChange={e => setPoolId(e.target.value)}
          placeholder="请输入要修改的资金池ID"
        />
      </div>
      
      {isLoading && <div>加载中...</div>}
      
      {poolInfo && (
        <div style={{marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4}}>
          <h4>当前资金池信息:</h4>
          <div>创建者: {poolInfo.creator}</div>
          <div>当前最大借款额度: {ethers.utils.formatUnits(poolInfo.maxBorrowAmount, 18)} Ether</div>
          <div>当前池名称: {poolInfo.name}</div>
          <div>当前手续费比例: {poolInfo.creatorFeeRate.toString()} (百万分之一)</div>
          <div>当前借款代币: {poolInfo.borrowToken}</div>
          <div>总资金: {ethers.utils.formatUnits(poolInfo.totalFunds, 18)}</div>
          <div>已借出: {ethers.utils.formatUnits(poolInfo.totalBorrowed, 18)}</div>
        </div>
      )}
      
      <div style={{marginTop: 16}}>
        <h4>修改参数:</h4>
        <div>
          <label>最大借款额度（单位：Ether）: </label>
          <input
            value={maxBorrow}
            onChange={e => setMaxBorrow(e.target.value)}
            placeholder="请输入新的最大借款额度（Ether）"
          />
        </div>
        <div>
          <label>池名称: </label>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)}
            placeholder="请输入新的池名称"
          />
        </div>
        <div>
          <label>手续费比例（百万分之一）: </label>
          <input 
            value={feeRate} 
            onChange={e => setFeeRate(e.target.value)}
            placeholder="请输入新的手续费比例"
          />
        </div>
        <div>
          <label>借款代币: </label>
          <select value={selectedToken} onChange={e => setSelectedToken(e.target.value)}>
            {TOKENS.map(token => (
              <option key={token.address} value={token.address}>
                {token.symbol} ({token.address})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <button 
        onClick={handleModify} 
        disabled={!poolInfo || isLoading}
        style={{marginTop: 16}}
      >
        修改资金池参数
      </button>
      
      <div style={{marginTop: 8, color: status.includes('失败') ? 'red' : 'green'}}>
        {status}
      </div>
    </div>
  );
};

export default ModifyPool; 