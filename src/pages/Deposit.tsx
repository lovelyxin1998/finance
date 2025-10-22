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
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../constants/contracts'

interface DepositProps {
  provider: any
  account: string
}

const Deposit = ({ provider, account }: DepositProps) => {
  const [userFunds, setUserFunds] = useState<string>('0.00')
  const [isLoading, setIsLoading] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  // 组件加载时自动查询用户存款金额
  useEffect(() => {
    if (provider && account) {
      fetchUserFunds()
    }
  }, [provider, account])

  // 查询用户存款金额
  const fetchUserFunds = async () => {
    if (!provider || !account) return

    setIsLoading(true)
    setError('')

    try {
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, provider)
      const fundsWei = await contract.userFunds(account)
      
      // 将Wei转换为Ether，保留两位小数
      const fundsEther = parseFloat(ethers.utils.formatEther(fundsWei)).toFixed(2)
      setUserFunds(fundsEther)

      console.log('用户存款金额:', fundsWei.toString(), 'Wei =', fundsEther, 'USDT')
    } catch (error) {
      console.error('查询用户存款金额失败:', error)
      const errorMessage = error instanceof Error ? error.message : '查询失败'
      setError(errorMessage)
      
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 存款操作
  const handleDeposit = async () => {
    if (!provider || !account) {
      toast({
        title: '错误',
        description: '请先连接钱包',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsDepositing(true)
    setError('')

    try {
      console.log('开始存款操作...')
      console.log('存款地址:', account)
      
      const signer = provider.getSigner()
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer)

      console.log('调用 deposit 函数...')
      const tx = await contract.deposit()
      console.log('交易已发送:', tx.hash)
      
      toast({
        title: '交易已发送',
        description: `交易哈希: ${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      })

      // 等待交易确认
      await tx.wait()
      console.log('交易已确认')
      
      toast({
        title: '存款成功',
        description: '存款操作已完成',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // 存款成功后刷新用户存款金额
      await fetchUserFunds()
      
    } catch (error) {
      console.error('存款失败:', error)
      let errorMessage = '存款失败'
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          errorMessage = '用户拒绝了交易请求'
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = '钱包余额不足支付gas费用'
        } else if (error.message.includes('execution reverted')) {
          errorMessage = '合约执行失败，请检查存款条件'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDepositing(false)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchUserFunds()
  }

  return (
    <Box p={{ base: 2, md: 4 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <Card>
          <CardBody>
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <Heading size={{ base: "sm", md: "md" }}>存款管理</Heading>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                当前钱包地址: {account ? `${account.slice(0, 8)}...${account.slice(-6)}` : '未连接'}
              </Text>
              
              <Divider />
              
              {/* 用户存款金额显示 */}
              <Stat textAlign="center">
                <StatLabel fontSize={{ base: "sm", md: "md" }}>当前存款金额</StatLabel>
                <StatNumber fontSize={{ base: "lg", md: "xl" }} color="blue.500">
                  {isLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    `${userFunds} USDT`
                  )}
                </StatNumber>
                <StatHelpText fontSize={{ base: "xs", md: "sm" }}>
                  单位: USDT
                </StatHelpText>
              </Stat>
              
              <HStack spacing={{ base: 2, md: 4 }} flexWrap="wrap">
                <Button
                  colorScheme="blue"
                  onClick={handleRefresh}
                  isLoading={isLoading}
                  loadingText="查询中..."
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                >
                  刷新余额
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleDeposit}
                  isLoading={isDepositing}
                  loadingText="存款中..."
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                  isDisabled={isLoading || !provider || !account}
                >
                  存款
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize={{ base: "xs", md: "sm" }}>操作错误: {error}</Text>
          </Alert>
        )}

        {/* 使用说明 */}
        <Card>
          <CardBody>
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <Heading size={{ base: "sm", md: "md" }}>使用说明</Heading>
              <VStack spacing={2} align="stretch">
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  • 点击"存款"按钮将调用合约的 deposit() 函数
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  • 存款金额将显示在"当前存款金额"中，单位为 USDT
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  • 金额从 Wei 自动转换为 Ether 并保留两位小数
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  • 点击"刷新余额"可以重新查询最新的存款金额
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* 加载状态 */}
        {isLoading && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="center">
                <Spinner size={{ base: "md", md: "lg" }} color="blue.500" />
                <Text fontSize={{ base: "sm", md: "md" }}>正在查询存款金额，请稍候...</Text>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  )
}

export default Deposit
