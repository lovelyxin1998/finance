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
  Textarea,
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

interface WhitelistManagerProps {
  provider: ethers.providers.Web3Provider | null
}

const WhitelistManager = ({ provider }: WhitelistManagerProps) => {
  const [poolId, setPoolId] = useState('')
  const [addresses, setAddresses] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInfo, setIsLoadingInfo] = useState(false)
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
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
        return
      }

      setIsLoadingInfo(true)
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
  }, [poolId, provider])

  const handleAddToWhitelist = async () => {
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
      if (!poolId || !addresses) {
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

      // 将地址字符串分割成数组，并过滤掉空地址
      const addressArray = addresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr && ethers.utils.isAddress(addr))

      if (addressArray.length === 0) {
        toast({
          title: '错误',
          description: '请输入有效的地址',
          status: 'error',
          duration: 5000,
        })
        return
      }

      const tx = await contract.addToWhitelist(poolId, addressArray)
      await tx.wait()

      toast({
        title: '成功',
        description: '白名单添加成功',
        status: 'success',
        duration: 5000,
      })

      setAddresses('')
    } catch (error) {
      console.error('添加白名单失败:', error)
      toast({
        title: '错误',
        description: '添加白名单失败',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFromWhitelist = async () => {
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
      if (!poolId || !addresses) {
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

      // 将地址字符串分割成数组，并过滤掉空地址
      const addressArray = addresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr && ethers.utils.isAddress(addr))

      if (addressArray.length === 0) {
        toast({
          title: '错误',
          description: '请输入有效的地址',
          status: 'error',
          duration: 5000,
        })
        return
      }

      const tx = await contract.removeFromWhitelist(poolId, addressArray)
      await tx.wait()

      toast({
        title: '成功',
        description: '白名单移除成功',
        status: 'success',
        duration: 5000,
      })

      setAddresses('')
    } catch (error) {
      console.error('移除白名单失败:', error)
      toast({
        title: '错误',
        description: '移除白名单失败',
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
            <Heading size="md">白名单管理</Heading>

            <FormControl isRequired>
              <FormLabel>资金池 ID</FormLabel>
              <Input
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                placeholder="请输入资金池 ID"
                type="number"
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

            <FormControl isRequired>
              <FormLabel>地址列表</FormLabel>
              <Textarea
                value={addresses}
                onChange={(e) => setAddresses(e.target.value)}
                placeholder="请输入地址列表，每行一个地址"
                rows={5}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                每行输入一个地址，系统会自动过滤无效地址
              </Text>
            </FormControl>

            <Box w="100%">
              <Button
                colorScheme="blue"
                onClick={handleAddToWhitelist}
                isLoading={isLoading}
                mr={4}
                w="45%"
                isDisabled={!poolInfo}
              >
                添加到白名单
              </Button>
              <Button
                colorScheme="red"
                onClick={handleRemoveFromWhitelist}
                isLoading={isLoading}
                w="45%"
                isDisabled={!poolInfo}
              >
                从白名单移除
              </Button>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default WhitelistManager 