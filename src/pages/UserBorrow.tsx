import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  GridItem,
  Heading,
  Text,
  useToast,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../constants/contracts'
import { USDT_ADDRESS, USDT_ABI } from '../constants/contracts'

interface UserBorrowProps {
  provider: ethers.providers.Web3Provider | null
}

interface PoolInfo {
  name: string
  creator: string
  maxBorrowAmount: string
  creatorFeeRate: string
  totalFunds: string
  totalBorrowed: string
  addressListLength: string
}

interface BorrowerInfo {
  address: string
  amount: string
}

const UserBorrow = ({ provider }: UserBorrowProps) => {
  const [poolId, setPoolId] = useState<string>('')
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [borrowers, setBorrowers] = useState<BorrowerInfo[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingBorrowers, setIsLoadingBorrowers] = useState<boolean>(false)
  const toast = useToast()

  // 获取用户的资金池ID
  const fetchUserPoolId = async () => {
    if (!provider) {
      toast({
        title: '错误',
        description: '请先连接钱包',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        LENDING_POOL_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      const address = await signer.getAddress()
      console.log('正在获取用户资金池ID，地址:', address)
      
      const id = await contract.userPoolId(address)
      console.log('获取到的资金池ID:', id.toString())
      
      setPoolId(id.toString())

      // 如果ID不为0，获取资金池信息
      if (id.toString() !== '0') {
        console.log('资金池ID有效，开始获取详细信息...')
        await fetchPoolInfo(id.toString())
        await fetchBorrowers(id.toString())
      } else {
        console.log('用户未加入资金池')
        // 清空相关状态
        setPoolInfo(null)
        setBorrowers([])
      }
    } catch (error) {
      console.error('获取用户资金池ID失败:', error)
      
      // 根据错误类型提供不同的处理建议
      let errorMessage = '获取用户资金池ID失败'
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = '网络连接失败，请检查网络状态'
        } else if (error.message.includes('user rejected')) {
          errorMessage = '用户拒绝了交易请求'
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = '钱包余额不足'
        }
      }
      
      toast({
        title: '错误',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
      // 如果是网络错误，延迟重试
      if (error instanceof Error && error.message.includes('network')) {
        setTimeout(() => {
          if (provider) {
            console.log('网络错误，延迟重试...')
            fetchUserPoolId()
          }
        }, 3000)
      }
    }
  }

  // 获取资金池信息
  const fetchPoolInfo = async (id: string) => {
    if (!provider) return

    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        LENDING_POOL_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      const info = await contract.getPoolInfo(id)
      setPoolInfo({
        name: info.pool.name,
        creator: info.pool.creator,
        maxBorrowAmount: ethers.utils.formatUnits(info.pool.maxBorrowAmount, 18),
        creatorFeeRate: ethers.utils.formatUnits(info.pool.creatorFeeRate, 18),
        totalFunds: ethers.utils.formatUnits(info.pool.totalFunds, 18),
        totalBorrowed: ethers.utils.formatUnits(info.pool.totalBorrowed, 18),
        addressListLength: info.addressListLength.toString(),
      })
    } catch (error) {
      console.error('获取资金池信息失败:', error)
      toast({
        title: '错误',
        description: '获取资金池信息失败',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // 获取借款人信息
  const fetchBorrowers = async (id: string) => {
    if (!provider) return

    try {
      setIsLoadingBorrowers(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        LENDING_POOL_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

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

  // 刷新借款人信息
  const handleRefreshBorrowers = async () => {
    if (poolId && poolId !== '0') {
      await fetchBorrowers(poolId)
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

    setIsLoading(true)

    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        LENDING_POOL_ADDRESS,
        LENDING_POOL_ABI,
        signer
      )

      // 获取用户代理地址
      const address = await signer.getAddress()
      const userProxyAddress = await contract.userProxies(address)
      
      console.log('用户代理地址:', userProxyAddress)
      
      if (userProxyAddress === ethers.constants.AddressZero) {
        // 用户代理地址未创建，使用现行方案
        console.log('用户代理地址未创建，使用合约调用方案')
        
        // 检查用户是否已授权 USDT
        const usdtContract = new ethers.Contract(
          USDT_ADDRESS,
          USDT_ABI,
          signer
        )
        const allowance = await usdtContract.allowance(address, LENDING_POOL_ADDRESS)
        if (allowance.isZero()) {
          toast({
            title: '错误',
            description: '请先授权 USDT',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
          return
        }

        // 确保 poolId 是数字类型
        const poolIdNumber = parseInt(poolId)
        console.log('借款参数:', { poolId: poolIdNumber })
        
        const tx = await contract.borrow(poolIdNumber)
        console.log('交易已发送:', tx.hash)
        await tx.wait()

        toast({
          title: '成功',
          description: '借款成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        // 用户代理地址已创建，向代理地址发送0 BNB
        console.log('用户代理地址已创建，向代理地址发送0 BNB')
        
        const tx = await signer.sendTransaction({
          to: userProxyAddress,
          value: ethers.utils.parseEther('0')
        })
        console.log('向代理地址发送0 BNB交易已发送:', tx.hash)
        await tx.wait()

        toast({
          title: '成功',
          description: '借款成功（通过代理合约）',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }

      // 刷新资金池信息和借款人信息
      await fetchPoolInfo(poolId)
      await fetchBorrowers(poolId)
    } catch (error: any) {
      console.error('借款失败:', error)
      let errorMessage = '借款失败'
      
      // 解析具体的错误信息
      if (error.message) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = '资金池余额不足'
        } else if (error.message.includes('not authorized')) {
          errorMessage = '请先授权 USDT'
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

      // 获取用户代理地址
      const address = await signer.getAddress()
      const userProxyAddress = await contract.userProxies(address)
      
      console.log('用户代理地址:', userProxyAddress)
      
      if (userProxyAddress === ethers.constants.AddressZero) {
        // 用户代理地址未创建，使用现行方案
        console.log('用户代理地址未创建，使用合约调用方案')
        
        // 检查用户是否已授权 USDT
        const usdtContract = new ethers.Contract(
          USDT_ADDRESS,
          USDT_ABI,
          signer
        )
        const allowance = await usdtContract.allowance(address, LENDING_POOL_ADDRESS)
        if (allowance.isZero()) {
          toast({
            title: '错误',
            description: '请先授权 USDT',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
          return
        }

        // 确保 poolId 是数字类型
        const poolIdNumber = parseInt(poolId)
        console.log('还款参数:', { poolId: poolIdNumber })
        
        const tx = await contract.repay(poolIdNumber)
        console.log('交易已发送:', tx.hash)
        await tx.wait()

        toast({
          title: '成功',
          description: '还款成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        // 用户代理地址已创建，向代理地址发送0 BNB
        console.log('用户代理地址已创建，向代理地址发送0 BNB')
        
        const tx = await signer.sendTransaction({
          to: userProxyAddress,
          value: ethers.utils.parseEther('0')
        })
        console.log('向代理地址发送0 BNB交易已发送:', tx.hash)
        await tx.wait()

        toast({
          title: '成功',
          description: '还款成功（通过代理合约）',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }

      // 刷新资金池信息和借款人信息
      await fetchPoolInfo(poolId)
      await fetchBorrowers(poolId)
    } catch (error: any) {
      console.error('还款失败:', error)
      let errorMessage = '还款失败'
      
      // 解析具体的错误信息
      if (error.message) {
        if (error.message.includes('insufficient balance')) {
          errorMessage = 'USDT 余额不足'
        } else if (error.message.includes('not authorized')) {
          errorMessage = '请先授权 USDT'
        } else if (error.message.includes('no debt to repay')) {
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

  // 组件加载时获取用户资金池ID
  useEffect(() => {
    if (provider) {
      fetchUserPoolId()
    }
  }, [provider])

  // 当 poolId 变化时，重新获取相关数据
  useEffect(() => {
    if (provider && poolId && poolId !== '0') {
      fetchPoolInfo(poolId)
      fetchBorrowers(poolId)
    }
  }, [provider, poolId])

  // 添加重试机制：当 provider 连接后，延迟重试获取数据
  useEffect(() => {
    if (provider) {
      // 延迟重试，确保钱包完全连接
      const timer = setTimeout(() => {
        if (poolId === '0' || !poolInfo) {
          fetchUserPoolId()
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [provider])

  // 添加错误重试机制
  const retryFetch = async () => {
    if (provider) {
      try {
        await fetchUserPoolId()
      } catch (error) {
        console.error('重试获取数据失败:', error)
        // 如果重试失败，再次延迟重试
        setTimeout(() => {
          if (provider) {
            fetchUserPoolId()
          }
        }, 2000)
      }
    }
  }

  // 当 provider 状态变化时，重置相关状态
  useEffect(() => {
    if (!provider) {
      setPoolId('')
      setPoolInfo(null)
      setBorrowers([])
    }
  }, [provider])

  // 监听网络状态变化
  useEffect(() => {
    if (provider) {
      const handleNetworkChange = () => {
        console.log('网络状态发生变化，重新获取数据...')
        // 延迟重试，确保网络稳定
        setTimeout(() => {
          if (provider) {
            fetchUserPoolId()
          }
        }, 2000)
      }

      // 监听账户变化
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('账户发生变化:', accounts)
        if (accounts.length > 0) {
          // 账户变化后重新获取数据
          setTimeout(() => {
            if (provider) {
              fetchUserPoolId()
            }
          }, 1000)
        } else {
          // 账户断开连接
          setPoolId('')
          setPoolInfo(null)
          setBorrowers([])
        }
      }

      // 监听链变化
      const handleChainChanged = () => {
        console.log('链发生变化，重新获取数据...')
        setTimeout(() => {
          if (provider) {
            fetchUserPoolId()
          }
        }, 2000)
      }

      // 添加事件监听器
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)
        window.ethereum.on('networkChanged', handleNetworkChange)
      }

      // 清理函数
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
          window.ethereum.removeListener('chainChanged', handleChainChanged)
          window.ethereum.removeListener('networkChanged', handleNetworkChange)
        }
      }
    }
  }, [provider])

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* 全局刷新和状态区域 */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Heading size="md">借款还款管理</Heading>
                <Button
                  colorScheme="blue"
                  onClick={retryFetch}
                  isLoading={isLoading}
                  size="sm"
                >
                  全局刷新
                </Button>
              </Box>
              {provider && (
                <Text fontSize="sm" color="gray.600">
                  钱包已连接，网络状态正常
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>

        {poolId !== '0' && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">我的资金池</Heading>
                {poolId === '0' ? (
                  <Text color="red.500">您还没有加入任何资金池</Text>
                ) : (
                  <Text>资金池ID: {poolId}</Text>
                )}
                {!poolInfo && poolId !== '0' && (
                  <Text color="blue.500">正在加载资金池信息...</Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {poolInfo && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Heading size="md">资金池信息</Heading>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (poolId && poolId !== '0') {
                        fetchPoolInfo(poolId)
                        fetchBorrowers(poolId)
                      }
                    }}
                    isLoading={isLoading}
                  >
                    刷新信息
                  </Button>
                </Box>
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
                </Grid>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* 借款人列表 */}
        {poolId !== '0' && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Heading size="md">借款人列表</Heading>
                  <Button
                    size="sm"
                    onClick={handleRefreshBorrowers}
                    isLoading={isLoadingBorrowers}
                  >
                    刷新
                  </Button>
                </Box>
                
                {/* 调试信息 */}
                <Box p={2} bg="gray.100" borderRadius="md">
                  <Text fontSize="sm" color="gray.600">
                    调试信息: 借款人数量 = {borrowers.length}, 加载状态 = {isLoadingBorrowers ? 'true' : 'false'}
                  </Text>
                </Box>
                
                {isLoadingBorrowers ? (
                  <Text>加载中...</Text>
                ) : borrowers.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>序号</Th>
                          <Th>借款人地址</Th>
                          <Th>借款金额 (USDT)</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {borrowers.map((borrower, index) => (
                          <Tr key={`${borrower.address}-${index}`}>
                            <Td>{index + 1}</Td>
                            <Td>
                              <Text fontSize="sm" fontFamily="mono">
                                {borrower.address.slice(0, 6)}...{borrower.address.slice(-4)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme="blue">
                                {parseFloat(borrower.amount).toFixed(2)}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Text color="gray.500">暂无借款人</Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {poolId !== '0' && (
          <>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">借款</Heading>
                  <Text>借款金额将按照资金池的最大借款金额进行</Text>
                  <Button
                    colorScheme="blue"
                    onClick={handleBorrow}
                    isLoading={isLoading}
                  >
                    借款
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">还款</Heading>
                  <Text>还款金额将按照资金池的最大借款金额进行</Text>
                  <Button
                    colorScheme="green"
                    onClick={handleRepay}
                    isLoading={isLoading}
                  >
                    还款
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </>
        )}
      </VStack>
    </Box>
  )
}

export default UserBorrow 