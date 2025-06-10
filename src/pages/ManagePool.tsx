import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Card,
  CardBody,
  Heading,
  Text,
  Grid,
  GridItem,
  Skeleton,
  Divider,
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
}

const ManagePool = () => {
  const [poolId, setPoolId] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInfo, setIsLoadingInfo] = useState(false)
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const toast = useToast()

  const fetchPoolInfo = async (id: string) => {
    try {
      if (!id) {
        setPoolInfo(null)
        return
      }

      setIsLoadingInfo(true)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
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
      })
    } catch (error) {
      console.error('获取池信息失败:', error)
      toast({
        title: '错误',
        description: '获取池信息失败',
        status: 'error',
        duration: 5000,
      })
      setPoolInfo(null)
    } finally {
      setIsLoadingInfo(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (poolId) {
        fetchPoolInfo(poolId)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [poolId])

  const handleAddFunds = async () => {
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
      const provider = new ethers.providers.Web3Provider(window.ethereum)
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
      const provider = new ethers.providers.Web3Provider(window.ethereum)
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

  return (
    <Box maxW="800px" mx="auto">
      <Card mb={6}>
        <CardBody>
          <VStack spacing={6}>
            <Heading size="md">管理资金池</Heading>
            
            <FormControl>
              <FormLabel>资金池 ID</FormLabel>
              <Input
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                placeholder="请输入资金池 ID"
              />
            </FormControl>

            {isLoadingInfo ? (
              <Skeleton height="200px" width="100%" />
            ) : poolInfo ? (
              <Box w="100%" p={4} borderWidth={1} borderRadius="md">
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontWeight="medium">池名称</Text>
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
              </Box>
            ) : poolId ? (
              <Text color="red.500">未找到资金池信息</Text>
            ) : null}

            <Divider />

            <FormControl>
              <FormLabel>金额 (USDT)</FormLabel>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入金额"
                type="number"
                step="0.000001"
              />
            </FormControl>

            <Text fontSize="sm" color="gray.500">
              注意：金额单位为 USDT，最多支持 6 位小数
            </Text>

            <Box w="100%">
              <Button
                colorScheme="blue"
                onClick={handleAddFunds}
                isLoading={isLoading}
                mr={4}
                w="45%"
                isDisabled={!poolInfo}
              >
                添加资金
              </Button>
              <Button
                colorScheme="red"
                onClick={handleWithdrawFunds}
                isLoading={isLoading}
                w="45%"
                isDisabled={!poolInfo}
              >
                提取资金
              </Button>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default ManagePool 
export default ManagePool 