import { useState } from 'react'
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
}

interface QueryDataProps {
}

const QueryData = ({}: QueryDataProps) => {
  const [addresses, setAddresses] = useState('')
  const [queryData, setQueryData] = useState<QueryDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

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
      
      // 按照日期倒序排序
      const sortedData = data.sort((a: QueryDataItem, b: QueryDataItem) => {
        const dateA = new Date(a.day)
        const dateB = new Date(b.day)
        return dateB.getTime() - dateA.getTime() // 倒序：最新的日期在前
      })
      
      setQueryData(sortedData)

      toast({
        title: '成功',
        description: `成功查询到 ${data.length} 条数据`,
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
              <Heading size={{ base: "sm", md: "md" }}>奖励查询</Heading>
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
                  共找到 {queryData.length} 条数据
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