import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  Text,
  Input,
  useToast,
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../constants/contracts'

interface PoolInfo {
  name: string
  creator: string
  maxBorrowAmount: string
  creatorFeeRate: string
  totalFunds: string
  totalBorrowed: string
  addressListLength: string
  borrowToken: string
}

interface BorrowerInfo {
  address: string
  amount: string
}

interface ManagePoolProps {
  provider: ethers.providers.Web3Provider | null
}

const ManagePool = ({ provider }: ManagePoolProps) => {
  const [poolId, setPoolId] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [borrowers, setBorrowers] = useState<BorrowerInfo[]>([])
  const [isLoadingBorrowers, setIsLoadingBorrowers] = useState(false)
  const toast = useToast()

  const fetchPoolInfo = async (id: string) => {
    if (!provider) {
      toast({
        title: '错误',
        description: '请先连接钱包',
        status: 'error',
        duration: 5000,
      })
      return
    }

    try {
      if (!id) {
        setPoolInfo(null)
        setBorrowers([])
        return
      }

      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer)

      const info = await contract.getPoolInfo(id)
      setPoolInfo({
        name: info.pool.name,
        creator: info.pool.creator,
        maxBorrowAmount: ethers.utils.formatUnits(info.pool.maxBorrowAmount, 18),
        creatorFeeRate: ethers.utils.formatUnits(info.pool.creatorFeeRate, 18),
        totalFunds: ethers.utils.formatUnits(info.pool.totalFunds, 18),
        totalBorrowed: ethers.utils.formatUnits(info.pool.totalBorrowed, 18),
        addressListLength: info.addressListLength.toString(),
        borrowToken: info.pool.borrowToken,
      })

      // 获取借款人信息
      await fetchBorrowers(id)
    } catch (error) {
      console.error('获取池信息失败:', error)
      toast({
        title: '错误',
        description: '获取池信息失败',
        status: 'error',
        duration: 5000,
      })
      setPoolInfo(null)
      setBorrowers([])
    } finally {
      setIsLoading(false)
    }
  }

  // 获取借款人信息
  const fetchBorrowers = async (id: string) => {
    if (!provider) return

    try {
      setIsLoadingBorrowers(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer)

      console.log('=== 调试信息 ===')
      console.log('合约地址:', LENDING_POOL_ADDRESS)
      console.log('网络信息:', await provider.getNetwork())
      console.log('当前账户:', await signer.getAddress())
      console.log('正在获取借款人信息，池ID:', id)
      
      // 先测试合约连接
      try {
        const poolExists = await contract._poolExists(id)
        console.log('资金池是否存在:', poolExists)
        
        if (!poolExists) {
          console.log('资金池不存在，跳过获取借款人信息')
          setBorrowers([])
          return
        }
        
        // 测试直接查询资金池信息
        const poolInfo = await contract.pools(id)
        console.log('直接查询的资金池信息:', poolInfo)
        
      } catch (error) {
        console.log('检查资金池存在性失败:', error)
      }
      
      console.log('开始调用 getBorrowersWithAmounts...')
      const [borrowerAddresses, borrowerAmounts] = await contract.getBorrowersWithAmounts(id)
      
      console.log('原始借款人地址:', borrowerAddresses)
      console.log('原始借款金额:', borrowerAmounts)
      console.log('借款人地址数量:', borrowerAddresses.length)
      console.log('借款金额数量:', borrowerAmounts.length)
      
      if (borrowerAddresses.length === 0) {
        console.log('没有找到借款人')
        setBorrowers([])
        return
      }
      
      const borrowersList: BorrowerInfo[] = borrowerAddresses.map((address: string, index: number) => {
        const amount = ethers.utils.formatUnits(borrowerAmounts[index], 18)
        console.log(`借款人 ${index + 1}:`, { address, amount })
        return {
          address,
          amount
        }
      })

      console.log('处理后的借款人列表:', borrowersList)
      setBorrowers(borrowersList)
    } catch (error) {
      console.error('获取借款人信息失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        code: (error as any).code,
        data: (error as any).data,
        transaction: (error as any).transaction
      })
      toast({
        title: '错误',
        description: `获取借款人信息失败: ${error instanceof Error ? error.message : '未知错误'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setBorrowers([])
    } finally {
      setIsLoadingBorrowers(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (poolId) {
        fetchPoolInfo(poolId)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [poolId, provider])

  const handleAddFunds = async () => {
    if (!provider) {
      toast({
        title: '错误',
        description: '请先连接钱包',
        status: 'error',
        duration: 5000,
      })
      return
    }

    try {
      if (!poolId || !amount) {
        toast({
          title: '错误',
          description: '请填写完整信息',
          status: 'error',
          duration: 5000,
        })
        return
      }

      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer)

      const amountWei = ethers.utils.parseUnits(amount, 18)
      const tx = await contract.addFunds(poolId, amountWei)
      await tx.wait()

      toast({
        title: '成功',
        description: '资金添加成功',
        status: 'success',
        duration: 5000,
      })

      setAmount('')
      fetchPoolInfo(poolId)
    } catch (error) {
      console.error('添加资金失败:', error)
      toast({
        title: '错误',
        description: '添加资金失败',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdrawFunds = async () => {
    if (!provider) {
      toast({
        title: '错误',
        description: '请先连接钱包',
        status: 'error',
        duration: 5000,
      })
      return
    }

    try {
      if (!poolId || !amount) {
        toast({
          title: '错误',
          description: '请填写完整信息',
          status: 'error',
          duration: 5000,
        })
        return
      }

      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer)

      const amountWei = ethers.utils.parseUnits(amount, 18)
      const tx = await contract.withdrawFunds(poolId, amountWei)
      await tx.wait()

      toast({
        title: '成功',
        description: '资金提取成功',
        status: 'success',
        duration: 5000,
      })

      setAmount('')
      fetchPoolInfo(poolId)
    } catch (error) {
      console.error('提取资金失败:', error)
      toast({
        title: '错误',
        description: '提取资金失败',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetInfo = () => {
    if (poolId) {
      fetchPoolInfo(poolId)
    }
  }

  // 刷新借款人信息
  const handleRefreshBorrowers = async () => {
    if (poolId && poolId !== '0') {
      await fetchBorrowers(poolId)
    }
  }

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">资金池管理</Heading>
              <FormControl>
                <FormLabel>资金池ID</FormLabel>
                <Input
                  type="number"
                  value={poolId}
                  onChange={(e) => setPoolId(e.target.value)}
                  placeholder="请输入资金池ID"
                />
              </FormControl>
              <Button
                colorScheme="blue"
                onClick={handleGetInfo}
                isLoading={isLoading}
              >
                获取资金池信息
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {poolInfo && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">资金池信息</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontWeight="medium">名称</Text>
                    <Text>{poolInfo.name}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="medium">创建者</Text>
                    <Text>{poolInfo.creator}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="medium">最大借款金额</Text>
                    <Text>{poolInfo.maxBorrowAmount} USDT</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="medium">创建者费率</Text>
                    <Text>{poolInfo.creatorFeeRate} USDT</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="medium">总借款金额</Text>
                    <Text>{poolInfo.totalBorrowed} USDT</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="medium">白名单地址数量</Text>
                    <Text>{poolInfo.addressListLength}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="medium">当前资金总额</Text>
                    <Text>{poolInfo.totalFunds} USDT</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="medium">借款代币</Text>
                    <Text>{poolInfo.borrowToken}</Text>
                  </GridItem>
                </Grid>

                {/* 借款人信息 */}
                <Box mt={4}>
                  <HStack justify="space-between" align="center" mb={3}>
                    <Heading size="sm">借款人列表</Heading>
                    <Button
                      size="sm"
                      onClick={handleRefreshBorrowers}
                      isLoading={isLoadingBorrowers}
                      colorScheme="blue"
                    >
                      刷新借款人
                    </Button>
                  </HStack>
                  
                  {isLoadingBorrowers ? (
                    <Box textAlign="center" py={4}>
                      <Text color="blue.500">正在加载借款人信息...</Text>
                    </Box>
                  ) : borrowers.length > 0 ? (
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        共找到 {borrowers.length} 个借款人
                      </Text>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>序号</Th>
                            <Th>借款人地址</Th>
                            <Th>借款金额</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {borrowers.map((borrower, index) => (
                            <Tr key={index}>
                              <Td>
                                <Badge colorScheme="gray" variant="outline">
                                  {index + 1}
                                </Badge>
                              </Td>
                              <Td>
                                <Text fontSize="sm" fontFamily="mono">
                                  {borrower.address.slice(0, 6)}...{borrower.address.slice(-4)}
                                </Text>
                              </Td>
                              <Td>
                                <Badge colorScheme="blue" variant="solid">
                                  {borrower.amount} USDT
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Text color="gray.500">暂无借款人</Text>
                    </Box>
                  )}
                  
                  {/* 调试信息 */}
                  <Box mt={3} p={2} bg="gray.100" borderRadius="md">
                    <Text fontSize="xs" color="gray.600">
                      调试信息: 借款人数量 = {borrowers.length}, 加载状态 = {isLoadingBorrowers ? 'true' : 'false'}
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">添加资金</Heading>
              <FormControl>
                <FormLabel>金额 (USDT)</FormLabel>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入金额"
                />
              </FormControl>
              <Button
                colorScheme="green"
                onClick={handleAddFunds}
                isLoading={isLoading}
              >
                添加资金
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">提取资金</Heading>
              <FormControl>
                <FormLabel>金额 (USDT)</FormLabel>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入金额"
                />
              </FormControl>
              <Button
                colorScheme="red"
                onClick={handleWithdrawFunds}
                isLoading={isLoading}
              >
                提取资金
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}

export default ManagePool 