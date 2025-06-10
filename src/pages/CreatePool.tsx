import { useState } from 'react'
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
  InputGroup,
  InputRightAddon,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../constants/contracts'

interface CreatePoolProps {
  provider: ethers.providers.Web3Provider
}

const CreatePool = ({ provider }: CreatePoolProps) => {
  const [poolId, setPoolId] = useState('')
  const [name, setName] = useState('')
  const [maxBorrowAmount, setMaxBorrowAmount] = useState('')
  const [creatorFeeRate, setCreatorFeeRate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleCreatePool = async () => {
    try {
      if (!poolId || !name || !maxBorrowAmount || !creatorFeeRate) {
        toast({
          title: '错误',
          description: '请填写所有必填字段',
          status: 'error',
          duration: 5000,
        })
        return
      }

      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer)

      const maxBorrowAmountWei = ethers.utils.parseUnits(maxBorrowAmount, 18)
      const creatorFeeRateWei = ethers.utils.parseUnits(creatorFeeRate, 0)

      const tx = await contract.createPool(
        poolId,
        maxBorrowAmountWei,
        name,
        creatorFeeRateWei
      )
      await tx.wait()

      toast({
        title: '成功',
        description: '资金池创建成功',
        status: 'success',
        duration: 5000,
      })

      // 清空表单
      setPoolId('')
      setName('')
      setMaxBorrowAmount('')
      setCreatorFeeRate('')
    } catch (error) {
      console.error('创建资金池失败:', error)
      toast({
        title: '错误',
        description: '创建资金池失败',
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
            <Heading size="md">创建资金池</Heading>

            <FormControl isRequired>
              <FormLabel>资金池 ID</FormLabel>
              <Input
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                placeholder="请输入资金池 ID"
                type="number"
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                请输入一个唯一的数字作为资金池 ID
              </Text>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>资金池名称</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入资金池名称"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>最大借款金额 (USDT)</FormLabel>
              <Input
                value={maxBorrowAmount}
                onChange={(e) => setMaxBorrowAmount(e.target.value)}
                placeholder="请输入最大借款金额"
                type="number"
                step="0.000001"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>创建者费率</FormLabel>
              <InputGroup>
                <Input
                  value={creatorFeeRate}
                  onChange={(e) => setCreatorFeeRate(e.target.value)}
                  placeholder="请输入创建者费率"
                  type="number"
                  step="1"
                />
                <InputRightAddon>百万分之一</InputRightAddon>
              </InputGroup>
              <Text fontSize="sm" color="gray.500" mt={1}>
                例如：输入 100 表示 0.01%（万分之一）
              </Text>
            </FormControl>

            <Text fontSize="sm" color="gray.500">
              注意：金额单位为 USDT，最多支持 6 位小数
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleCreatePool}
              isLoading={isLoading}
              w="100%"
            >
              创建资金池
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default CreatePool 