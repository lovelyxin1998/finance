import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  Heading,
  Text,
  useToast,
  VStack,
  Input,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../constants/contracts'
import { USDT_ABI } from '../constants/contracts'
import { TOKENS } from '../constants/contracts'

interface SpecificPoolBorrowProps {
  provider: ethers.providers.Web3Provider | null
  account: string
}

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

const SpecificPoolBorrow = ({ provider, account }: SpecificPoolBorrowProps) => {
  const [poolId, setPoolId] = useState<string>('')
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null)
  const [borrowers, setBorrowers] = useState<BorrowerInfo[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingPool, setIsLoadingPool] = useState<boolean>(false)
  const [isLoadingBorrowers, setIsLoadingBorrowers] = useState<boolean>(false)
  const toast = useToast()

  // 根据代币地址获取代币符号
  const getTokenSymbol = (tokenAddress: string): string => {
    const token = TOKENS.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase())
    return token ? token.symbol : 'Unknown'
  }

  // 查询pool信息和白名单状态
  const fetchPoolInfo = async () => {
    if (!provider || !poolId) {
      toast({
        title: '错误',
        description: '请输入pool ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoadingPool(true)
    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        LENDING_POOL_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      // 直接获取pool信息，如果pool不存在会自动抛出错误
      const info = await contract.getPoolInfo(poolId)
      
      const poolInfoData: PoolInfo = {
        name: info.pool.name,
        creator: info.pool.creator,
        maxBorrowAmount: ethers.utils.formatUnits(info.pool.maxBorrowAmount, 18),
        creatorFeeRate: info.pool.creatorFeeRate.toString(),
        totalFunds: ethers.utils.formatUnits(info.pool.totalFunds, 18),
        totalBorrowed: ethers.utils.formatUnits(info.pool.totalBorrowed, 18),
        addressListLength: info.addressListLength.toString(),
        borrowToken: info.pool.borrowToken || '0x0000000000000000000000000000000000000000'
      }

      setPoolInfo(poolInfoData)

      // 查询当前用户是否在白名单中
      const whitelisted = await contract.whitelist(poolId, account)
      setIsWhitelisted(whitelisted)

      // 获取借款人信息
      await fetchBorrowers(poolId)

    } catch (error) {
      console.error('获取pool信息失败:', error)
      toast({
        title: '错误',
        description: '获取pool信息失败',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setPoolInfo(null)
      setIsWhitelisted(null)
    } finally {
      setIsLoadingPool(false)
    }
  }

  // 获取借款人信息
  const fetchBorrowers = async (id: string) => {
    if (!provider) return

    setIsLoadingBorrowers(true)
    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        LENDING_POOL_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      const [borrowerAddresses, borrowerAmounts] = await contract.getBorrowersWithAmounts(id)
      
      if (borrowerAddresses.length === 0) {
        setBorrowers([])
        return
      }
      
      const borrowersList: BorrowerInfo[] = borrowerAddresses.map((address: string, index: number) => {
        const amount = ethers.utils.formatUnits(borrowerAmounts[index], 18)
        return {
          address,
          amount
        }
      })

      setBorrowers(borrowersList)
    } catch (error) {
      console.error('获取借款人信息失败:', error)
      setBorrowers([])
    } finally {
      setIsLoadingBorrowers(false)
    }
  }

  // 借款
  const handleBorrow = async () => {
    if (!provider || !poolId) {
      toast({
        title: '错误',
        description: '请先连接钱包',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!isWhitelisted) {
      toast({
        title: '错误',
        description: '您不在白名单中，无法借款',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        LENDING_POOL_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      // 检查用户是否已授权代币
      const tokenContract = new ethers.Contract(
        poolInfo!.borrowToken,
        USDT_ABI,
        signer
      )
      const allowance = await tokenContract.allowance(account, LENDING_POOL_ADDRESS)
      if (allowance.isZero()) {
        toast({
          title: '错误',
          description: '请先授权代币',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      // 直接调用主合约的borrow函数
      const tx = await contract.borrow(poolId)
      await tx.wait()

      toast({
        title: '成功',
        description: '借款成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // 刷新信息
      await fetchPoolInfo()
    } catch (error: any) {
      console.error('借款失败:', error)
      let errorMessage = '借款失败'
      
      if (error.message) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = '资金池余额不足'
        } else if (error.message.includes('not authorized')) {
          errorMessage = '请先授权代币'
        } else if (error.message.includes('user not in whitelist')) {
          errorMessage = '您不在白名单中'
        }
      }

      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 还款
  const handleRepay = async () => {
    if (!provider || !poolId) {
      toast({
        title: '错误',
        description: '请先连接钱包',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        LENDING_POOL_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      // 直接调用主合约的repay函数
      const tx = await contract.repay(poolId)
      await tx.wait()

      toast({
        title: '成功',
        description: '还款成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // 刷新信息
      await fetchPoolInfo()
    } catch (error: any) {
      console.error('还款失败:', error)
      let errorMessage = '还款失败'
      
      if (error.message) {
        if (error.message.includes('no debt')) {
          errorMessage = '没有需要还款的债务'
        }
      }

      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" textAlign="center" color="teal.600">
          特定Pool借款还款
        </Heading>

        {/* Pool ID 输入和查询 */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Pool ID</FormLabel>
                <Input
                  value={poolId}
                  onChange={(e) => setPoolId(e.target.value)}
                  placeholder="请输入Pool ID"
                  type="number"
                />
              </FormControl>
              <Button
                colorScheme="teal"
                onClick={fetchPoolInfo}
                isLoading={isLoadingPool}
                loadingText="查询中..."
                width="full"
              >
                查询Pool信息
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Pool 信息显示 */}
        {poolInfo && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="teal.600">Pool 信息</Heading>
                
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                  <Stat>
                    <StatLabel>Pool名称</StatLabel>
                    <StatNumber>{poolInfo.name}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>创建者</StatLabel>
                    <StatNumber fontSize="sm">
                      {poolInfo.creator.slice(0, 6)}...{poolInfo.creator.slice(-4)}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>最大借款额度</StatLabel>
                    <StatNumber>{poolInfo.maxBorrowAmount} {getTokenSymbol(poolInfo.borrowToken)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>创建者手续费率</StatLabel>
                    <StatNumber>{(parseInt(poolInfo.creatorFeeRate) / 10000).toFixed(2)}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>总资金</StatLabel>
                    <StatNumber>{poolInfo.totalFunds} {getTokenSymbol(poolInfo.borrowToken)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>已借出</StatLabel>
                    <StatNumber>{poolInfo.totalBorrowed} {getTokenSymbol(poolInfo.borrowToken)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>白名单人数</StatLabel>
                    <StatNumber>{poolInfo.addressListLength}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>借款代币</StatLabel>
                    <StatNumber fontSize="sm">
                      {getTokenSymbol(poolInfo.borrowToken)}
                    </StatNumber>
                  </Stat>
                </Grid>

                {/* 白名单状态 */}
                <Box>
                  <Text fontWeight="bold" mb={2}>白名单状态:</Text>
                  {isWhitelisted === true ? (
                    <Badge colorScheme="green" fontSize="md" p={2}>
                      ✅ 在白名单中
                    </Badge>
                  ) : isWhitelisted === false ? (
                    <Badge colorScheme="red" fontSize="md" p={2}>
                      ❌ 不在白名单中
                    </Badge>
                  ) : (
                    <Badge colorScheme="gray" fontSize="md" p={2}>
                      ⏳ 查询中...
                    </Badge>
                  )}
                </Box>

                <Divider />

                {/* 借款人列表 */}
                <Box>
                  <Text fontWeight="bold" mb={2}>借款人列表</Text>
                  {isLoadingBorrowers ? (
                    <Box textAlign="center" py={4}>
                      <Spinner />
                      <Text mt={2}>加载中...</Text>
                    </Box>
                  ) : borrowers.length > 0 ? (
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>序号</Th>
                          <Th>地址</Th>
                          <Th>借款金额</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {borrowers.map((borrower, index) => (
                          <Tr key={borrower.address}>
                            <Td>{index + 1}</Td>
                            <Td fontSize="sm">
                              {borrower.address.slice(0, 6)}...{borrower.address.slice(-4)}
                            </Td>
                            <Td>{borrower.amount} {getTokenSymbol(poolInfo.borrowToken)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="gray.500">暂无借款人</Text>
                  )}
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* 借款还款操作 */}
        {poolInfo && (
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md" color="teal.600">操作</Heading>
                
                {isWhitelisted === false && (
                  <Alert status="warning">
                    <AlertIcon />
                    您不在白名单中，无法进行借款操作
                  </Alert>
                )}

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} width="full">
                  <Button
                    colorScheme="green"
                    onClick={handleBorrow}
                    isLoading={isLoading}
                    loadingText="借款中..."
                    disabled={!isWhitelisted}
                    size="lg"
                    height="60px"
                  >
                    借款
                  </Button>
                  <Button
                    colorScheme="orange"
                    onClick={handleRepay}
                    isLoading={isLoading}
                    loadingText="还款中..."
                    size="lg"
                    height="60px"
                  >
                    还款
                  </Button>
                </Grid>

                <Text fontSize="sm" color="gray.600" textAlign="center">
                  注意：借款和还款操作需要支付相应的手续费
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  )
}

export default SpecificPoolBorrow
