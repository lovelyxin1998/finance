import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Card,
  CardBody,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  useClipboard,
  useBreakpointValue,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { USDT_ADDRESS, USDT_ABI, LENDING_POOL_ADDRESS } from '../constants/contracts'

interface AuthorizeProps {
  onAuthorized: () => void
}

const Authorize = ({ onAuthorized }: AuthorizeProps) => {
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('0')
  const [allowance, setAllowance] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  const { hasCopied, onCopy } = useClipboard(LENDING_POOL_ADDRESS)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: '错误',
          description: '请安装 MetaMask 钱包',
          status: 'error',
          duration: 5000,
        })
        return
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      setAddress(address)

      // 获取 USDT 余额
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer)
      const balance = await usdtContract.balanceOf(address)
      setBalance(ethers.utils.formatUnits(balance, 18))

      // 获取授权额度
      const allowance = await usdtContract.allowance(address, LENDING_POOL_ADDRESS)
      setAllowance(ethers.utils.formatUnits(allowance, 18))
    } catch (error) {
      console.error('连接钱包失败:', error)
      toast({
        title: '错误',
        description: '连接钱包失败',
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleApprove = async () => {
    try {
      setIsLoading(true)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer)

      // 授权最大额度
      const maxAmount = ethers.constants.MaxUint256
      const tx = await usdtContract.approve(LENDING_POOL_ADDRESS, maxAmount)
      await tx.wait()

      // 更新授权额度
      const newAllowance = await usdtContract.allowance(address, LENDING_POOL_ADDRESS)
      setAllowance(ethers.utils.formatUnits(newAllowance, 18))

      toast({
        title: '成功',
        description: '授权成功',
        status: 'success',
        duration: 5000,
      })

      onAuthorized()
    } catch (error) {
      console.error('授权失败:', error)
      toast({
        title: '错误',
        description: '授权失败',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    onCopy()
    toast({
      title: '成功',
      description: '已复制到剪贴板',
      status: 'success',
      duration: 2000,
      position: 'top',
    })
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', connectWallet)
      window.ethereum.on('chainChanged', connectWallet)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', connectWallet)
        window.ethereum.removeListener('chainChanged', connectWallet)
      }
    }
  }, [])

  return (
    <Box maxW="600px" mx="auto" px={4}>
      <Card>
        <CardBody>
          <VStack spacing={6}>
            <Heading size="md">授权 USDT</Heading>

            <Box w="100%">
              <Text mb={2} fontWeight="medium">合约地址：</Text>
              <InputGroup size="md">
                <Input
                  value={LENDING_POOL_ADDRESS}
                  isReadOnly
                  pr="4.5rem"
                  fontSize="sm"
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={handleCopy}
                    colorScheme={hasCopied ? 'green' : 'blue'}
                  >
                    {hasCopied ? '已复制' : '复制'}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>
            
            {!address ? (
              <Button colorScheme="blue" onClick={connectWallet} w="100%">
                连接钱包
              </Button>
            ) : (
              <VStack spacing={4} w="100%">
                <Text>已连接钱包: {address}</Text>
                
                <Flex
                  direction={isMobile ? 'column' : 'row'}
                  gap={4}
                  w="100%"
                >
                  <Stat>
                    <StatLabel>USDT 余额</StatLabel>
                    <StatNumber>{balance}</StatNumber>
                    <StatHelpText>当前余额</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>授权额度</StatLabel>
                    <StatNumber>{allowance}</StatNumber>
                    <StatHelpText>已授权额度</StatHelpText>
                  </Stat>
                </Flex>

                <Button
                  colorScheme="green"
                  onClick={handleApprove}
                  isLoading={isLoading}
                  isDisabled={parseFloat(allowance) > 0}
                  w="100%"
                >
                  {parseFloat(allowance) > 0 ? '已授权' : '授权 USDT'}
                </Button>
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default Authorize 