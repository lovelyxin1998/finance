export const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'; // BSC 链 USDT
export const LENDING_POOL_ADDRESS = '0xeB76547574aCF7b4c67FDF96B6c67DfD722e658F'; // 请替换为 BSC 上你的合约地址

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
      { "internalType": "uint256", "name": "_creatorFeeRate", "type": "uint256" }
    ],
    "name": "createPool",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
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
            }
          ],
          "internalType": "struct IPancakeV3Factory.Pool",
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
    }
]; 