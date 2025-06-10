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

const UserBorrow = ({ provider }: UserBorrowProps) => {
  const [poolId, setPoolId] = useState<string>('')
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
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
      const id = await contract.userPoolId(address)
      setPoolId(id.toString())

      // 如果ID不为0，获取资金池信息
      if (id.toString() !== '0') {
        await fetchPoolInfo(id.toString())
      }
    } catch (error) {
      console.error('获取用户资金池ID失败:', error)
      toast({
        title: '错误',
        description: '获取用户资金池ID失败',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
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

      // 检查用户是否已授权 USDT
      const address = await signer.getAddress()
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

      // 刷新资金池信息
      await fetchPoolInfo(poolId)
    } catch (error: any) {
      console.error('借款失败:', error)
      let errorMessage = '借款失败'
      
      // 解析具体的错误信息
      if (error.message) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = '资金池余额不足'
        } else if (error.message.includes('not authorized')) {
          errorMessage = '请先授权 USDT'
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

      // 检查用户是否已授权 USDT
      const address = await signer.getAddress()
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

      // 刷新资金池信息
      await fetchPoolInfo(poolId)
    } catch (error: any) {
      console.error('还款失败:', error)
      let errorMessage = '还款失败'
      
      // 解析具体的错误信息
      if (error.message) {
        if (error.message.includes('insufficient balance')) {
          errorMessage = 'USDT 余额不足'
        } else if (error.message.includes('not authorized')) {
          errorMessage = '请先授权 USDT'
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
    fetchUserPoolId()
  }, [provider])

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">我的资金池</Heading>
              {poolId === '0' ? (
                <Text color="red.500">您还没有加入任何资金池</Text>
              ) : (
                <Text>资金池ID: {poolId}</Text>
              )}
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
                </Grid>
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