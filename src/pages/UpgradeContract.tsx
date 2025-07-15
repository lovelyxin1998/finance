import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react'
import { ethers } from 'ethers'

// ProxyAdmin 合约的 ABI
const PROXY_ADMIN_ABI = [
  {
    "inputs": [
      {
        "internalType": "contract TransparentUpgradeableProxy",
        "name": "proxy",
        "type": "address"
      }
    ],
    "name": "getProxyImplementation",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract TransparentUpgradeableProxy",
        "name": "proxy",
        "type": "address"
      }
    ],
    "name": "getProxyAdmin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract TransparentUpgradeableProxy",
        "name": "proxy",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "changeProxyAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract TransparentUpgradeableProxy",
        "name": "proxy",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "upgrade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract TransparentUpgradeableProxy",
        "name": "proxy",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "upgradeAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
]

interface UpgradeContractProps {
  provider: ethers.providers.Web3Provider | null
}

const UpgradeContract = ({ provider }: UpgradeContractProps) => {
  const [proxyAdminAddress, setProxyAdminAddress] = useState('')
  const [proxyAddress, setProxyAddress] = useState('')
  const [newImplementation, setNewImplementation] = useState('')
  const [newAdmin, setNewAdmin] = useState('')
  const [callData, setCallData] = useState('')
  const [currentImplementation, setCurrentImplementation] = useState('')
  const [currentAdmin, setCurrentAdmin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  // 获取当前实现地址
  const getCurrentImplementation = async () => {
    if (!provider || !proxyAdminAddress || !proxyAddress) {
      toast({
        title: '错误',
        description: '请填写代理管理员地址和代理地址',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        proxyAdminAddress,
        PROXY_ADMIN_ABI,
        signer
      )

      const implementation = await contract.getProxyImplementation(proxyAddress)
      setCurrentImplementation(implementation)
      
      toast({
        title: '成功',
        description: '获取当前实现地址成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('获取当前实现地址失败:', error)
      toast({
        title: '错误',
        description: '获取当前实现地址失败: ' + error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 获取当前管理员地址
  const getCurrentAdmin = async () => {
    if (!provider || !proxyAdminAddress || !proxyAddress) {
      toast({
        title: '错误',
        description: '请填写代理管理员地址和代理地址',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        proxyAdminAddress,
        PROXY_ADMIN_ABI,
        signer
      )

      const admin = await contract.getProxyAdmin(proxyAddress)
      setCurrentAdmin(admin)
      
      toast({
        title: '成功',
        description: '获取当前管理员地址成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('获取当前管理员地址失败:', error)
      toast({
        title: '错误',
        description: '获取当前管理员地址失败: ' + error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 升级合约实现
  const upgradeImplementation = async () => {
    if (!provider || !proxyAdminAddress || !proxyAddress || !newImplementation) {
      toast({
        title: '错误',
        description: '请填写所有必要信息',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        proxyAdminAddress,
        PROXY_ADMIN_ABI,
        signer
      )

      const tx = await contract.upgrade(proxyAddress, newImplementation)
      await tx.wait()

      toast({
        title: '成功',
        description: '合约升级成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('合约升级失败:', error)
      toast({
        title: '错误',
        description: '合约升级失败: ' + error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 更改代理管理员
  const changeAdmin = async () => {
    if (!provider || !proxyAdminAddress || !proxyAddress || !newAdmin) {
      toast({
        title: '错误',
        description: '请填写所有必要信息',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        proxyAdminAddress,
        PROXY_ADMIN_ABI,
        signer
      )

      const tx = await contract.changeProxyAdmin(proxyAddress, newAdmin)
      await tx.wait()

      toast({
        title: '成功',
        description: '代理管理员更改成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('更改代理管理员失败:', error)
      toast({
        title: '错误',
        description: '更改代理管理员失败: ' + error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 升级并调用
  const upgradeAndCall = async () => {
    if (!provider || !proxyAdminAddress || !proxyAddress || !newImplementation) {
      toast({
        title: '错误',
        description: '请填写所有必要信息',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsLoading(true)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        proxyAdminAddress,
        PROXY_ADMIN_ABI,
        signer
      )

      const data = callData ? callData : '0x'
      const tx = await contract.upgradeAndCall(proxyAddress, newImplementation, data, {
        value: ethers.utils.parseEther('0')
      })
      await tx.wait()

      toast({
        title: '成功',
        description: '升级并调用成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('升级并调用失败:', error)
      toast({
        title: '错误',
        description: '升级并调用失败: ' + error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
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
              <Heading size="md">升级合约</Heading>
              <Text color="gray.600">
                管理代理合约的升级和管理员变更
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">基本信息</Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <FormControl>
                    <FormLabel>代理管理员地址</FormLabel>
                    <Input
                      value={proxyAdminAddress}
                      onChange={(e) => setProxyAdminAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>代理合约地址</FormLabel>
                    <Input
                      value={proxyAddress}
                      onChange={(e) => setProxyAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </FormControl>
                </GridItem>
              </Grid>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">查询功能</Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Button
                    colorScheme="blue"
                    onClick={getCurrentImplementation}
                    isLoading={isLoading}
                    width="100%"
                  >
                    获取当前实现地址
                  </Button>
                  {currentImplementation && (
                    <Text mt={2} fontSize="sm">
                      当前实现: {currentImplementation}
                    </Text>
                  )}
                </GridItem>
                <GridItem>
                  <Button
                    colorScheme="green"
                    onClick={getCurrentAdmin}
                    isLoading={isLoading}
                    width="100%"
                  >
                    获取当前管理员
                  </Button>
                  {currentAdmin && (
                    <Text mt={2} fontSize="sm">
                      当前管理员: {currentAdmin}
                    </Text>
                  )}
                </GridItem>
              </Grid>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">升级功能</Heading>
              <FormControl>
                <FormLabel>新实现地址</FormLabel>
                <Input
                  value={newImplementation}
                  onChange={(e) => setNewImplementation(e.target.value)}
                  placeholder="0x..."
                />
              </FormControl>
              <Button
                colorScheme="purple"
                onClick={upgradeImplementation}
                isLoading={isLoading}
              >
                升级合约实现
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">管理员功能</Heading>
              <FormControl>
                <FormLabel>新管理员地址</FormLabel>
                <Input
                  value={newAdmin}
                  onChange={(e) => setNewAdmin(e.target.value)}
                  placeholder="0x..."
                />
              </FormControl>
              <Button
                colorScheme="orange"
                onClick={changeAdmin}
                isLoading={isLoading}
              >
                更改代理管理员
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">升级并调用</Heading>
              <FormControl>
                <FormLabel>调用数据 (可选)</FormLabel>
                <Input
                  value={callData}
                  onChange={(e) => setCallData(e.target.value)}
                  placeholder="0x..."
                />
              </FormControl>
              <Button
                colorScheme="red"
                onClick={upgradeAndCall}
                isLoading={isLoading}
              >
                升级并调用
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}

export default UpgradeContract 