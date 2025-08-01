import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  useToast,
  Card,
  CardBody,
  Heading,
  Text,
  InputGroup,
  Input,
  InputRightElement,
  useClipboard,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../constants/contracts'

interface HomeProps {
  provider?: ethers.providers.Web3Provider | null;
  account?: string;
}

const Home = ({ provider, account }: HomeProps) => {
  const toast = useToast()
  const { hasCopied, onCopy } = useClipboard(LENDING_POOL_ADDRESS)
  const [userProxyAddress, setUserProxyAddress] = useState<string>('')
  const [proxyHasCopied, setProxyHasCopied] = useState(false)
  const [isLoadingProxy, setIsLoadingProxy] = useState(false)

  // 获取用户代理地址
  const getUserProxyAddress = async () => {
    if (!provider || !account) return
    
    try {
      setIsLoadingProxy(true)
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, provider)
      const proxyAddress = await contract.userProxies(account)
      setUserProxyAddress(proxyAddress)
    } catch (error) {
      console.error('获取用户代理地址失败:', error)
      setUserProxyAddress('')
    } finally {
      setIsLoadingProxy(false)
    }
  }

  // 复制用户代理地址
  const handleCopyProxy = () => {
    if (userProxyAddress) {
      navigator.clipboard.writeText(userProxyAddress)
      setProxyHasCopied(true)
      toast({
        title: '复制成功',
        description: '用户代理地址已复制到剪贴板',
        status: 'success',
        duration: 2000,
      })
      setTimeout(() => setProxyHasCopied(false), 2000)
    }
  }

  const handleCopy = () => {
    onCopy()
    toast({
      title: '复制成功',
      description: '合约地址已复制到剪贴板',
      status: 'success',
      duration: 2000,
    })
  }

  // 当账户变化时获取代理地址
  useEffect(() => {
    if (provider && account) {
      getUserProxyAddress()
    } else {
      setUserProxyAddress('')
    }
  }, [provider, account])

  return (
    <Box maxW="800px" mx="auto">
      <Card mb={6}>
        <CardBody>
          <VStack spacing={6}>
            <Heading size="md">欢迎使用借贷系统</Heading>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>温馨提示</AlertTitle>
                <AlertDescription>
                  往本合约转入 0 BNB 即可轻松借款还款，无需其他操作
                </AlertDescription>
              </Box>
            </Alert>

            <Box w="100%">
              <Text mb={2} fontWeight="medium">借贷合约地址</Text>
              <InputGroup size="md">
                <Input
                  value={LENDING_POOL_ADDRESS}
                  isReadOnly
                  pr="4.5rem"
                  bg="gray.50"
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
              <Text fontSize="sm" color="gray.500" mt={1}>
                请确保使用正确的合约地址进行转账
              </Text>
            </Box>

            {/* 用户代理地址展示 */}
            {account && (
              <Box w="100%">
                <Text mb={2} fontWeight="medium">您的用户代理地址</Text>
                <InputGroup size="md">
                  <Input
                    value={isLoadingProxy ? '加载中...' : userProxyAddress || '未创建'}
                    isReadOnly
                    pr="4.5rem"
                    bg="gray.50"
                  />
                  <InputRightElement width="4.5rem">
                    {isLoadingProxy ? (
                      <Spinner size="sm" />
                    ) : (
                      <Button
                        h="1.75rem"
                        size="sm"
                        onClick={handleCopyProxy}
                        colorScheme={proxyHasCopied ? 'green' : 'blue'}
                        isDisabled={!userProxyAddress}
                      >
                        {proxyHasCopied ? '已复制' : '复制'}
                      </Button>
                    )}
                  </InputRightElement>
                </InputGroup>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {userProxyAddress ? '这是您的专属代理合约地址，用于代币中转' : '连接钱包后将自动创建您的专属代理合约'}
                </Text>
              </Box>
            )}

            <Text fontSize="sm" color="gray.500">
              本系统支持创建资金池、管理白名单、添加/提取资金等功能。
              请使用导航栏访问相应功能。
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default Home 