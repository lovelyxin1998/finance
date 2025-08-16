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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { LENDING_POOL_ABI, REWARD_CONTRACT_ADDRESS } from '../constants/contracts'

interface ClaimDataItem {
  id: number
  address: string
  total_usd_value: string
  effective_usd_value: string
  refund_usd_value: string
  inviter: string
  deal_status: number
  refund_status: number
  del_status: number
  rate: string
  created_at: string
  sign: string
  day: string
  hasRefund?: boolean
  refundAmount?: string
}

interface ClaimRewardsProps {
  provider: any
  account: string
}

const ClaimRewards = ({ provider, account }: ClaimRewardsProps) => {
  const [claimData, setClaimData] = useState<ClaimDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  // 组件加载时自动查询数据
  useEffect(() => {
    if (provider && account) {
      fetchClaimData()
    }
  }, [provider, account])

  // 查询可领取的奖励数据
  const fetchClaimData = async () => {
    if (!provider || !account) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: [account]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('查询结果:', data)
      
      // 过滤出有效的记录（sign不为空）
      const validData = data.filter((item: ClaimDataItem) => 
        item.sign && item.sign !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
      
      console.log('过滤后的有效数据:', validData)
      
      // 检查每条记录在合约中的退款状态
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        REWARD_CONTRACT_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      // 为每条记录添加退款状态
      const dataWithRefundStatus = await Promise.all(
        validData.map(async (item: ClaimDataItem) => {
          try {
            const refundAmount = await contract.userRefunds(account, item.day)
            const hasRefund = refundAmount.gt(0)
            return {
              ...item,
              hasRefund,
              refundAmount: refundAmount.toString()
            }
          } catch (error) {
            console.error(`查询退款状态失败 ${item.day}:`, error)
            return {
              ...item,
              hasRefund: false,
              refundAmount: '0'
            }
          }
        })
      )
      
      console.log('添加退款状态后的数据:', dataWithRefundStatus)
      
      // 按照日期倒序排序
      const sortedData = dataWithRefundStatus.sort((a: any, b: any) => {
        const dateA = new Date(a.day)
        const dateB = new Date(b.day)
        return dateB.getTime() - dateA.getTime()
      })
      
      setClaimData(sortedData)

      // 统计未领取的记录数
      const unclaimedCount = sortedData.filter((item: any) => !item.hasRefund).length

      toast({
        title: '查询成功',
        description: `找到 ${sortedData.length} 条有效记录，其中 ${unclaimedCount} 条未领取`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('查询失败:', error)
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

  // 计算入池率
  const calculateRate = (effectiveValue: string, totalValue: string): string => {
    if (!totalValue || totalValue === '0') return '0.00%'
    
    try {
      const effective = ethers.BigNumber.from(effectiveValue)
      const total = ethers.BigNumber.from(totalValue)
      
      if (total.isZero()) return '0.00%'
      
      // 入池率 = (有效金额 / 总买入金额) * 100%
      const rate = effective.mul(100).div(total)
      const ratePercent = rate.toNumber()
      
      // 限制最大值为100%
      const finalRate = Math.min(ratePercent, 100)
      return `${finalRate.toFixed(2)}%`
    } catch (error) {
      console.error('计算入池率失败:', error)
      return '0.00%'
    }
  }

  // 领取所有未返还的费用
  const handleClaimAll = async () => {
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

    if (claimData.length === 0) {
      toast({
        title: '提示',
        description: '没有可领取的奖励',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsClaiming(true)

    try {
      console.log('开始领取奖励...')
      console.log('领取地址:', account)
      console.log('领取数据:', claimData)
      
      // 获取所有未退款的 sign 数据
      const validSigns = claimData
        .filter(item => !item.hasRefund && item.sign && item.sign !== '0x0000000000000000000000000000000000000000000000000000000000000000')
        .map(item => item.sign)
      
      if (validSigns.length === 0) {
        toast({
          title: '提示',
          description: '没有有效的签名数据可领取',
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      console.log('有效的签名数据:', validSigns)
      
      // 调用智能合约的 verifyMulti 接口
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        REWARD_CONTRACT_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      console.log('调用 verifyMulti 接口...')
      const tx = await contract.verifyMulti(validSigns)
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
        title: '领取成功',
        description: `成功领取 ${validSigns.length} 条记录的奖励`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // 领取成功后刷新数据
      await fetchClaimData()
      
    } catch (error) {
      console.error('领取失败:', error)
      let errorMessage = '领取失败'
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          errorMessage = '用户拒绝了交易请求'
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = '钱包余额不足支付gas费用'
        } else if (error.message.includes('execution reverted')) {
          errorMessage = '合约执行失败，请检查签名数据'
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
      setIsClaiming(false)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchClaimData()
  }

  return (
    <Box p={{ base: 2, md: 4 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <Card>
          <CardBody>
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <Heading size={{ base: "sm", md: "md" }}>奖励记录</Heading>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                当前钱包地址: {account ? `${account.slice(0, 8)}...${account.slice(-6)}` : '未连接'}
              </Text>
              
              <HStack spacing={{ base: 2, md: 4 }} flexWrap="wrap">
                <Button
                  colorScheme="blue"
                  onClick={handleRefresh}
                  isLoading={isLoading}
                  loadingText="查询中..."
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                >
                  刷新数据
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleClaimAll}
                  isLoading={isClaiming}
                  loadingText="领取中..."
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                  isDisabled={claimData.length === 0 || isLoading}
                >
                  领取所有奖励
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize={{ base: "xs", md: "sm" }}>查询错误: {error}</Text>
          </Alert>
        )}

        {/* 查询结果 */}
        {claimData.length > 0 && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                <Heading size={{ base: "sm", md: "md" }}>有效记录</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  共找到 {claimData.length} 条有效记录，其中 {claimData.filter((item: ClaimDataItem) => !item.hasRefund).length} 条未领取
                </Text>
                
                <Box overflowX="auto" maxW="100%">
                  <Table variant="simple" size={{ base: "xs", md: "sm" }}>
                    <Thead>
                      <Tr>
                        <Th fontSize={{ base: "xs", md: "sm" }}>地址</Th>
                        <Th fontSize={{ base: "xs", md: "sm" }}>日期</Th>
                        <Th fontSize={{ base: "xs", md: "sm" }}>总买入金额</Th>
                        <Th fontSize={{ base: "xs", md: "sm" }}>有效数量</Th>
                        <Th fontSize={{ base: "xs", md: "sm" }}>返还金额</Th>
                        <Th fontSize={{ base: "xs", md: "sm" }}>入池率</Th>
                        <Th fontSize={{ base: "xs", md: "sm" }}>是否返还</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {claimData.map((item, index) => (
                        <Tr key={index}>
                          <Td>
                            <Text fontSize={{ base: "xs", md: "sm" }} fontFamily="mono">
                              {item.address.slice(0, 8)}...{item.address.slice(-6)}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize={{ base: "xs", md: "sm" }}>{item.day}</Text>
                          </Td>
                          <Td>
                            <Text fontSize={{ base: "xs", md: "sm" }}>
                              {ethers.utils.formatEther(item.total_usd_value).split('.')[0]}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize={{ base: "xs", md: "sm" }}>
                              {ethers.utils.formatEther(item.effective_usd_value).split('.')[0]}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize={{ base: "xs", md: "sm" }}>
                              {parseFloat(ethers.utils.formatEther(item.refund_usd_value)).toFixed(2)}
                            </Text>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={parseFloat(calculateRate(item.effective_usd_value, item.total_usd_value)) > 50 ? 'green' : 'orange'}
                              fontSize={{ base: "xs", md: "sm" }}
                            >
                              {calculateRate(item.effective_usd_value, item.total_usd_value)}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={item.hasRefund ? 'green' : 'red'} 
                              fontSize={{ base: "xs", md: "sm" }}
                            >
                              {item.hasRefund ? '已返还' : '未返还'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* 无数据提示 */}
        {!isLoading && claimData.length === 0 && !error && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="center">
                <Text fontSize={{ base: "sm", md: "md" }} color="gray.500">
                  暂无有效记录
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.400">
                  当前地址没有相关记录，或所有记录都无效
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="center">
                <Spinner size={{ base: "md", md: "lg" }} color="blue.500" />
                <Text fontSize={{ base: "sm", md: "md" }}>正在查询可领取记录，请稍候...</Text>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  )
}

export default ClaimRewards 