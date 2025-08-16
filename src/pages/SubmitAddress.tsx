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
  Input,
  Textarea,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'

interface CheckResult {
  address: string
  exists: boolean
}

interface SubmitAddressProps {
  account: string
}

const SubmitAddress = ({ account }: SubmitAddressProps) => {
  const [submitter, setSubmitter] = useState('')
  const [addresses, setAddresses] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [submitResult, setSubmitResult] = useState<any>(null)
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const [error, setError] = useState('')
  const toast = useToast()

  // 在页面顶部显示当前钱包地址
  const displayAddress = account ? `${account.slice(0, 8)}...${account.slice(-6)}` : '未连接'

  // 处理提交人输入
  const handleSubmitterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitter(e.target.value)
  }

  // 处理地址输入
  const handleAddressesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddresses(e.target.value)
  }

  // 格式化地址列表
  const formatAddresses = (addressesText: string): string[] => {
    return addressesText
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)
  }

  // 提交地址
  const handleSubmit = async () => {
    if (!submitter.trim()) {
      toast({
        title: '错误',
        description: '请输入提交人姓名',
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
        description: '请输入至少一个地址',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    setError('')
    setSubmitResult(null)

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: addressList,
          submitter: submitter.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('提交结果:', data)
      setSubmitResult(data)

      toast({
        title: '提交成功',
        description: `成功提交 ${addressList.length} 个地址`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('提交失败:', error)
      const errorMessage = error instanceof Error ? error.message : '提交失败'
      setError(errorMessage)
      
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 查询地址
  const handleCheck = async () => {
    const addressList = formatAddresses(addresses)
    if (addressList.length === 0) {
      toast({
        title: '错误',
        description: '请输入要查询的地址',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsChecking(true)
    setError('')
    setCheckResults([])

    try {
      let query = ''
      if (addressList.length === 1) {
        query = `address=${encodeURIComponent(addressList[0])}`
      } else {
        query = `addresses=${addressList.map(a => encodeURIComponent(a)).join(',')}`
      }

      const response = await fetch(`/api/check?${query}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('查询结果:', data)
      
      if (data.results && Array.isArray(data.results)) {
        setCheckResults(data.results)
      } else {
        setCheckResults([])
      }

      toast({
        title: '查询成功',
        description: `成功查询 ${addressList.length} 个地址`,
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
      setIsChecking(false)
    }
  }

  // 清空数据
  const handleClear = () => {
    setSubmitter('')
    setAddresses('')
    setSubmitResult(null)
    setCheckResults([])
    setError('')
  }

  return (
    <Box p={{ base: 2, md: 4 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <Card>
          <CardBody>
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <Heading size={{ base: "sm", md: "md" }}>提交地址</Heading>
              
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                当前钱包地址: {displayAddress}
              </Text>

              <FormControl>
                <FormLabel fontSize={{ base: "sm", md: "md" }}>提交人</FormLabel>
                <Input
                  value={submitter}
                  onChange={handleSubmitterChange}
                  placeholder="请输入提交人姓名"
                  fontSize={{ base: "sm", md: "md" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={{ base: "sm", md: "md" }}>地址（每行一个）</FormLabel>
                <Textarea
                  value={addresses}
                  onChange={handleAddressesChange}
                  placeholder="请输入以太坊地址，每行一个&#10;例如：&#10;0x1234...&#10;0x5678..."
                  rows={10}
                  fontSize={{ base: "sm", md: "md" }}
                  fontFamily="mono"
                />
              </FormControl>

              <HStack spacing={{ base: 2, md: 4 }} flexWrap="wrap">
                <Button
                  colorScheme="blue"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  loadingText="提交中..."
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                >
                  提交
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleCheck}
                  isLoading={isChecking}
                  loadingText="查询中..."
                  size={{ base: "sm", md: "md" }}
                  flex={{ base: "1", md: "auto" }}
                >
                  查询
                </Button>
                <Button
                  colorScheme="gray"
                  onClick={handleClear}
                  isDisabled={isSubmitting || isChecking}
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
            <Text fontSize={{ base: "xs", md: "sm" }}>操作错误: {error}</Text>
          </Alert>
        )}

        {/* 提交结果 */}
        {submitResult && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                <Heading size={{ base: "sm", md: "md" }}>提交结果</Heading>
                <Box
                  bg="gray.50"
                  p={4}
                  borderRadius="md"
                  fontFamily="mono"
                  fontSize={{ base: "xs", md: "sm" }}
                  overflowX="auto"
                >
                  <pre>{JSON.stringify(submitResult, null, 2)}</pre>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* 查询结果 */}
        {checkResults.length > 0 && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                <Heading size={{ base: "sm", md: "md" }}>查询结果</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  共查询 {checkResults.length} 个地址
                </Text>
                
                <Box overflowX="auto" maxW="100%">
                  <Table variant="simple" size={{ base: "xs", md: "sm" }}>
                    <Thead>
                      <Tr>
                        <Th fontSize={{ base: "xs", md: "sm" }}>地址</Th>
                        <Th fontSize={{ base: "xs", md: "sm" }}>是否存在</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {checkResults.map((result, index) => (
                        <Tr key={index}>
                          <Td>
                            <Text
                              fontSize={{ base: "xs", md: "sm" }}
                              fontFamily="mono"
                              wordBreak="break-all"
                            >
                              {result.address}
                            </Text>
                          </Td>
                          <Td textAlign="center">
                            {result.exists ? (
                              <Badge colorScheme="green" fontSize={{ base: "lg", md: "xl" }}>
                                ✅
                              </Badge>
                            ) : (
                              <Badge colorScheme="red" fontSize={{ base: "lg", md: "xl" }}>
                                ❌
                              </Badge>
                            )}
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
        {(isSubmitting || isChecking) && (
          <Card>
            <CardBody>
              <VStack spacing={{ base: 3, md: 4 }} align="center">
                <Spinner size={{ base: "md", md: "lg" }} color="blue.500" />
                <Text fontSize={{ base: "sm", md: "md" }}>
                  {isSubmitting ? '正在提交地址，请稍候...' : '正在查询地址，请稍候...'}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  )
}

export default SubmitAddress 