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
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { LENDING_POOL_ABI, REWARD_CONTRACT_ADDRESS } from '../constants/contracts'

interface QueryDataItem {
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

interface QueryDataProps {
  provider: any
  account: string
}

const QueryData = ({ provider, account }: QueryDataProps) => {
  const [addresses, setAddresses] = useState('')
  const [queryData, setQueryData] = useState<QueryDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  // 组件加载时自动将当前钱包地址填入查询框
  useEffect(() => {
    if (account) {
      setAddresses(account)
    }
  }, [account])

  // 处理地址输入，支持多行输入
  const handleAddressesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddresses(e.target.value)
  }

  // 格式化地址列表
  const formatAddresses = (addressesText: string): string[] => {
    return addressesText
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0 && ethers.utils.isAddress(addr))
  }

  // 计算入池率
  const calculateRate = (effectiveValue: string, totalValue: string): string => {
    // 检查输入值是否有效
    if (!effectiveValue || !totalValue || 
        effectiveValue === '' || totalValue === '' || 
        effectiveValue === '0' || totalValue === '0') {
      return '0.00%'
    }
    
    try {
      const effective = ethers.BigNumber.from(effectiveValue)
      const total = ethers.BigNumber.from(totalValue)
      
      if (total.isZero()) return '0.00%'
      
      // 入池率 = (有效金额 / (总买入金额 * 2)) * 100%
      // 因为有效金额包含了买入和卖出的总和
      const rate = effective.mul(100).div(total.mul(2))
      const ratePercent = rate.toNumber()
      
      // 限制最大值为100%
      const finalRate = Math.min(ratePercent, 100)
      return `${finalRate.toFixed(2)}%`
    } catch (error) {
      console.error('计算入池率失败:', error, 'effectiveValue:', effectiveValue, 'totalValue:', totalValue)
      return '0.00%'
    }
  }

  // 查询数据
  const handleQuery = async () => {
    if (!addresses.trim()) {
      toast({
        title: '错误',
        description: '请输入至少一个地址',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const addressList = formatAddresses(addresses)
    if (addressList.length === 0) {
      toast({
        title: '错误',
        description: '请输入有效的以太坊地址',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: addressList
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('查询结果:', data)
      
      // 过滤出有效的记录（sign不为空）
      const validData = data.filter((item: QueryDataItem) => 
        item.sign && item.sign !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
      
      console.log('过滤后的有效数据:', validData)
      
      // 检查每条记录在合约中的退款状态（仅当provider和account存在时）
      let dataWithRefundStatus = validData
      if (provider && account) {
        try {
          const signer = provider.getSigner()
          const contract = new ethers.Contract(
            REWARD_CONTRACT_ADDRESS,
            LENDING_POOL_ABI,
            signer
          )

          // 为每条记录添加退款状态
          dataWithRefundStatus = await Promise.all(
            validData.map(async (item: QueryDataItem) => {
              // 如果 deal_status 不为 0，说明一定已返还
              if (item.deal_status !== 0) {
                return {
                  ...item,
                  hasRefund: true,
                  refundAmount: '0'
                }
              }
              
              // 只有当 deal_status 为 0 时，才查询链上数据确认是否真的已返还
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
        } catch (error) {
          console.error('查询退款状态失败:', error)
          // 如果查询失败，仍然显示数据但不包含退款状态
          dataWithRefundStatus = validData.map((item: QueryDataItem) => ({
            ...item,
            hasRefund: false,
            refundAmount: '0'
          }))
        }
      } else {
        // 如果没有provider和account，则不显示退款状态
        dataWithRefundStatus = validData.map((item: QueryDataItem) => ({
          ...item,
          hasRefund: false,
          refundAmount: '0'
        }))
      }
      
      console.log('添加退款状态后的数据:', dataWithRefundStatus)
      
      // 按照日期倒序排序
      const sortedData = dataWithRefundStatus.sort((a: any, b: any) => {
        const dateA = new Date(a.day)
        const dateB = new Date(b.day)
        return dateB.getTime() - dateA.getTime()
      })
      
      setQueryData(sortedData)

      // 统计未领取的记录数
      const unclaimedCount = sortedData.filter((item: any) => !item.hasRefund).length

      toast({
        title: '成功',
        description: `成功查询到 ${sortedData.length} 条有效记录，其中 ${unclaimedCount} 条未领取`,
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

    if (queryData.length === 0) {
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
      console.log('领取数据:', queryData)
      
      // 获取所有未退款的 sign 数据
      const validSigns = queryData
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
      await handleQuery()
      
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

  // 清空数据
  const handleClear = () => {
    setAddresses('')
    setQueryData([])
    setError('')
  }

  // 复制地址到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: '成功',
        description: '地址已复制到剪贴板',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    })
  }

  return (
    <Box p={{ base: 2, md: 4 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <Card>
          <CardBody>
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <Heading size={{ base: "sm", md: "md" }}>奖励查询与领取</Heading>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                当前钱包地址: {account ? `${account.slice(0, 8)}...${account.slice(-6)}` : '未连接'}
              </Text>
              <FormControl>
                <FormLabel fontSize={{ base: "sm", md: "md" }}>以太坊地址列表（每行一个地址）</FormLabel>
                <Textarea
                  value={addresses}
                  onChange={handleAddressesChange}
                  placeholder="请输入以太坊地址，每行一个&#10;例如：&#10;0x1234...&#10;0x5678..."
                  rows={5}
                  fontFamily="mono"
                  fontSize={{ base: "xs", md: "sm" }}
                  minH={{ base: "120px", md: "150px" }}
                />
              </FormControl>
              <HStack spacing={{ base: 2, md: 4 }} flexWrap="wrap">
                <Button
                  colorScheme="blue"
                  onClick={handleQuery}
                  isLoading={isLoading}
                  loadingText="查询中..."
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                >
                  查询数据
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleClaimAll}
                  isLoading={isClaiming}
                  loadingText="领取中..."
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                  isDisabled={queryData.length === 0 || isLoading || !provider || !account}
                >
                  领取所有奖励
                </Button>
                <Button
                  colorScheme="gray"
                  onClick={handleClear}
                  isDisabled={isLoading}
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                >
                  清空
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
        {queryData.length > 0 && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                <Heading size={{ base: "sm", md: "md" }}>查询结果</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  共找到 {queryData.length} 条有效记录，其中 {queryData.filter((item: QueryDataItem) => !item.hasRefund).length} 条未领取
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
                      {queryData.map((item, index) => (
                        <Tr key={index}>
                          <Td>
                            <Text
                              fontSize={{ base: "xs", md: "sm" }}
                              fontFamily="mono"
                              cursor="pointer"
                              onClick={() => copyToClipboard(item.address)}
                              _hover={{ color: 'blue.500' }}
                            >
                              {item.address.slice(0, 6)}...{item.address.slice(-4)}
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

        {/* 加载状态 */}
        {isLoading && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="center">
                <Spinner size={{ base: "md", md: "lg" }} color="blue.500" />
                <Text fontSize={{ base: "sm", md: "md" }}>正在查询数据，请稍候...</Text>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  )
}

export default QueryData 