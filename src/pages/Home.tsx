import { useState } from 'react'
import {
  Box,
  Button,
  VStack,
  useToast,
  Card,
  CardBody,
  Heading,
  Text,
  InputGroup,
  Input,
  InputRightElement,
  useClipboard,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { LENDING_POOL_ADDRESS } from '../constants/contracts'

const Home = () => {
  const toast = useToast()
  const { hasCopied, onCopy } = useClipboard(LENDING_POOL_ADDRESS)

  const handleCopy = () => {
    onCopy()
    toast({
      title: '复制成功',
      description: '合约地址已复制到剪贴板',
      status: 'success',
      duration: 2000,
    })
  }

  return (
    <Box maxW="800px" mx="auto">
      <Card mb={6}>
        <CardBody>
          <VStack spacing={6}>
            <Heading size="md">欢迎使用借贷系统</Heading>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>温馨提示</AlertTitle>
                <AlertDescription>
                  往本合约转入 0 BNB 即可轻松借款还款，无需其他操作
                </AlertDescription>
              </Box>
            </Alert>

            <Box w="100%">
              <Text mb={2} fontWeight="medium">借贷合约地址</Text>
              <InputGroup size="md">
                <Input
                  value={LENDING_POOL_ADDRESS}
                  isReadOnly
                  pr="4.5rem"
                  bg="gray.50"
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={handleCopy}
                    colorScheme={hasCopied ? 'green' : 'blue'}
                  >
                    {hasCopied ? '已复制' : '复制'}
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Text fontSize="sm" color="gray.500" mt={1}>
                请确保使用正确的合约地址进行转账
              </Text>
            </Box>

            <Text fontSize="sm" color="gray.500">
              本系统支持创建资金池、管理白名单、添加/提取资金等功能。
              请使用导航栏访问相应功能。
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default Home 