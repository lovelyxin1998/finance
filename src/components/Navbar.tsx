import { Box, Flex, Button, Text } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { ethers } from 'ethers'

interface NavbarProps {
  provider: ethers.providers.Web3Provider | null
  account: string
}

const Navbar = ({ provider, account }: NavbarProps) => {
  const location = useLocation();
  return (
    <Box bg="white" px={4} shadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="1200px" mx="auto">
        <Flex alignItems="center" gap={8}>
          <Button as={RouterLink} to="/" variant="ghost" fontWeight="bold" fontSize="lg">
            借贷平台
          </Button>
          <Flex gap={2}>
            <Button
              as={RouterLink}
              to="/create-pool"
              colorScheme={location.pathname === '/create-pool' ? 'teal' : 'gray'}
              variant={location.pathname === '/create-pool' ? 'solid' : 'ghost'}
              size="sm"
            >
              创建资金池
            </Button>
            <Button
              as={RouterLink}
              to="/manage-pool"
              colorScheme={location.pathname === '/manage-pool' ? 'teal' : 'gray'}
              variant={location.pathname === '/manage-pool' ? 'solid' : 'ghost'}
              size="sm"
            >
              管理资金池
            </Button>
            <Button
              as={RouterLink}
              to="/user-borrow"
              colorScheme={location.pathname === '/user-borrow' ? 'teal' : 'gray'}
              variant={location.pathname === '/user-borrow' ? 'solid' : 'ghost'}
              size="sm"
              fontWeight="bold"
            >
              借款还款
            </Button>
            <Button
              as={RouterLink}
              to="/whitelist"
              colorScheme={location.pathname === '/whitelist' ? 'teal' : 'gray'}
              variant={location.pathname === '/whitelist' ? 'solid' : 'ghost'}
              size="sm"
            >
              白名单管理
            </Button>
          </Flex>
        </Flex>
        <Flex alignItems="center" gap={4}>
          {account && (
            <Text fontSize="sm" color="gray.600">
              {account.slice(0, 6)}...{account.slice(-4)}
            </Text>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}

export default Navbar 