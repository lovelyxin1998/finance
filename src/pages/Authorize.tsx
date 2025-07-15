import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, HStack, Spinner, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { TOKENS, LENDING_POOL_ADDRESS } from '../constants/contracts';

interface AuthorizeProps {
  onAuthorized: () => void;
}

const Authorize = ({ onAuthorized }: AuthorizeProps) => {
  const [status, setStatus] = useState<{ [symbol: string]: boolean }>({});
  const [loading, setLoading] = useState<{ [symbol: string]: boolean }>({});
  const [checking, setChecking] = useState(true);
  const toast = useToast();

  const checkAll = async () => {
    setChecking(true);
    try {
      const { ethereum } = window as any;
      if (!ethereum) return;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const newStatus: { [symbol: string]: boolean } = {};
      for (const token of TOKENS) {
        const contract = new ethers.Contract(token.address, token.abi, signer);
        const allowance = await contract.allowance(address, LENDING_POOL_ADDRESS);
        newStatus[token.symbol] = !allowance.isZero();
      }
      setStatus(newStatus);
      if (Object.values(newStatus).every(v => v)) {
        onAuthorized();
      }
    } catch (e) {
      // 忽略
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkAll();
    // eslint-disable-next-line
  }, []);

  const handleApprove = async (symbol: string) => {
    setLoading(l => ({ ...l, [symbol]: true }));
    try {
      const { ethereum } = window as any;
      if (!ethereum) return;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const token = TOKENS.find(t => t.symbol === symbol)!;
      const contract = new ethers.Contract(token.address, token.abi, signer);
      const tx = await contract.approve(LENDING_POOL_ADDRESS, ethers.constants.MaxUint256);
      await tx.wait();
      toast({ title: `${symbol} 授权成功`, status: 'success', duration: 2000 });
      checkAll();
    } catch (e: any) {
      toast({ title: `${symbol} 授权失败`, description: e.message, status: 'error', duration: 3000 });
    } finally {
      setLoading(l => ({ ...l, [symbol]: false }));
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={10} p={6} bg="white" borderRadius="md" boxShadow="md">
      <VStack spacing={6}>
        <Text fontSize="xl" fontWeight="bold">请授权以下所有代币</Text>
        {checking ? <Spinner /> : (
          TOKENS.map(token => (
            <HStack key={token.symbol} w="100%" justify="space-between">
              <Text>{token.symbol}</Text>
              {status[token.symbol] ? (
                <Text color="green.500">已授权</Text>
              ) : (
                <Button
                  colorScheme="blue"
                  size="sm"
                  isLoading={loading[token.symbol]}
                  onClick={() => handleApprove(token.symbol)}
                >
                  授权
                </Button>
              )}
            </HStack>
          ))
        )}
        <Text fontSize="sm" color="gray.500">全部授权后自动进入下一步</Text>
      </VStack>
    </Box>
  );
};

export default Authorize; 