import { Box, Flex, Link as ChakraLink, Button } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

const Navbar = () => {
  return (
    <Box bg="white" px={4} shadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="1200px" mx="auto">
        <Flex alignItems="center" gap={8}>
          <ChakraLink as={RouterLink} to="/" fontWeight="bold" fontSize="lg">
            借贷平台
          </ChakraLink>
          
          <Flex gap={4}>
            <ChakraLink as={RouterLink} to="/create-pool">
              创建资金池
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/manage-pool">
              管理资金池
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/whitelist">
              白名单管理
            </ChakraLink>
          </Flex>
        </Flex>

        <Button as={RouterLink} to="/authorize" colorScheme="blue" size="sm">
          授权 USDT
        </Button>
      </Flex>
    </Box>
  )
}

export default Navbar 