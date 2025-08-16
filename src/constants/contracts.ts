// 便于维护的四个币地址
export const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // 请填写WBNB地址
export const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'; // BSC 链 USDT
export const USDC_ADDRESS = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'; // 请填写USDC地址
export const USD1_ADDRESS = '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d'; // 请填写USD1地址

export const LENDING_POOL_ADDRESS = '0xeB76547574aCF7b4c67FDF96B6c67DfD722e658F'; // 请替换为 BSC 上你的合约地址

// 奖励合约地址
export const REWARD_CONTRACT_ADDRESS = '0x4201E0e98Fa3B33483FCd009149b390302760D67';

export const USDT_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "_owner", "type": "address" },
      { "name": "_spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

export const LENDING_POOL_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" },
      { "internalType": "uint256", "name": "_maxBorrowAmount", "type": "uint256" },
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "uint256", "name": "_creatorFeeRate", "type": "uint256" },
      { "internalType": "address", "name": "_borrowToken", "type": "address" }
    ],
    "name": "createPool",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" },
      { "internalType": "uint256", "name": "_maxBorrowAmount", "type": "uint256" },
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "uint256", "name": "_creatorFeeRate", "type": "uint256" },
      { "internalType": "address", "name": "_borrowToken", "type": "address" }
    ],
    "name": "modifierPoolData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "addFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "withdrawFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" },
      { "internalType": "address[]", "name": "_users", "type": "address[]" }
    ],
    "name": "addToWhitelist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" },
      { "internalType": "address[]", "name": "_users", "type": "address[]" }
    ],
    "name": "removeFromWhitelist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_poolId",
          "type": "uint256"
        }
      ],
      "name": "getPoolInfo",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "maxBorrowAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalFunds",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalBorrowed",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "creatorFeeRate",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "borrowToken",
              "type": "address"
            }
          ],
          "internalType": "struct LendingPool.Pool",
          "name": "pool",
          "type": "tuple"
        },
        {
          "internalType": "uint256",
          "name": "addressListLength",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "userPoolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_poolId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "isWhitelisted",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_poolId",
          "type": "uint256"
        }
      ],
      "name": "borrow",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_poolId",
          "type": "uint256"
        }
      ],
      "name": "repay",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "", "type": "address" }
      ],
      "name": "userProxies",
      "outputs": [
        { "internalType": "address", "name": "", "type": "address" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "_poolId", "type": "uint256" }
      ],
      "name": "getBorrowersWithAmounts",
      "outputs": [
        { "internalType": "address[]", "name": "borrowers", "type": "address[]" },
        { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
  {
    "inputs": [
      { "internalType": "bytes[]", "name": "data", "type": "bytes[]" }
    ],
    "name": "verifyMulti",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "name": "userRefunds",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
    {
      "inputs": [
        { "internalType": "uint256", "name": "", "type": "uint256" }
      ],
      "name": "_poolExists",
      "outputs": [
        { "internalType": "bool", "name": "", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "", "type": "uint256" }
      ],
      "name": "pools",
      "outputs": [
        { "internalType": "address", "name": "creator", "type": "address" },
        { "internalType": "uint256", "name": "maxBorrowAmount", "type": "uint256" },
        { "internalType": "uint256", "name": "totalFunds", "type": "uint256" },
        { "internalType": "uint256", "name": "totalBorrowed", "type": "uint256" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "uint256", "name": "creatorFeeRate", "type": "uint256" },
        { "internalType": "address", "name": "borrowToken", "type": "address" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];

export const TOKENS = [
  { symbol: 'WBNB', address: WBNB_ADDRESS, abi: USDT_ABI },
  { symbol: 'USDT', address: USDT_ADDRESS, abi: USDT_ABI },
  { symbol: 'USDC', address: USDC_ADDRESS, abi: USDT_ABI },
  { symbol: 'USD1', address: USD1_ADDRESS, abi: USDT_ABI }
];