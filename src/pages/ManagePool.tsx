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
                onClick={fetchPoolInfo}
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
                </Grid>
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
