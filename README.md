# Vault Contract

The Vault contract is a solidity smart contract designed to serve as a secure and flexible solution for managing deposits and withdrawals of both Ether (ETH) and ERC20 tokens on the Ethereum blockchain. It also includes functionalities for wrapping and unwrapping Ether into WETH (Wrapped Ether).

Features
Deposit and Withdraw ETH: Users can deposit and withdraw ETH into and from the vault. Each user's ETH balance is tracked individually.

Deposit and Withdraw ERC20 Tokens: Users can deposit and withdraw ERC20 tokens of their choosing. The contract ensures that users cannot withdraw more tokens than they have deposited.

Wrap and Unwrap ETH: Users can wrap their deposited ETH into WETH and unwrap their WETH back into ETH within the vault.

## Commands

Run test

```
npm run test
```

Compile contract

```
npm run compile
```

Get test coverage

```
npm run coverage
```

Deploy contract

```
npx hardhat run scripts/deployVault.ts --network goerli    # or any other network
```

## Contract details

### weth

```solidity
contract IWETH weth
```

WETH address

### Deposit

```solidity
event Deposit(address user, address token, uint256 amount)
```

Emitted when user deposits any token

### Withdraw

```solidity
event Withdraw(address user, address token, uint256 amount)
```

Emitted when user withdraws any token

### WrapETH

```solidity
event WrapETH(address user, uint256 amount)
```

Emitted when the ETH is unwrapped

### UnwrapWETH

```solidity
event UnwrapWETH(address user, uint256 amount)
```

Emitted when the ETH is unwrapped

### constructor

```solidity
constructor(address _weth) public
```

Constructs the Vault contract.

#### Parameters

| Name   | Type    | Description                                       |
| ------ | ------- | ------------------------------------------------- |
| \_weth | address | The address of the WETH (Wrapped Ether) contract. |

### getEthDeposit

```solidity
function getEthDeposit(address user) external view returns (uint256)
```

Returns the ETH deposit of a user.

#### Parameters

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| user | address | The address of the user. |

#### Return Values

| Name | Type    | Description                  |
| ---- | ------- | ---------------------------- |
| [0]  | uint256 | The ETH deposit of the user. |

### getDeposit

```solidity
function getDeposit(address user, address token) external view returns (uint256)
```

Returns the deposit of a user for a specific token.

#### Parameters

| Name  | Type    | Description                     |
| ----- | ------- | ------------------------------- |
| user  | address | The address of the user.        |
| token | address | The address of the ERC20 token. |

#### Return Values

| Name | Type    | Description                                      |
| ---- | ------- | ------------------------------------------------ |
| [0]  | uint256 | The deposit of the user for the specified token. |

### transferOwnership

```solidity
function transferOwnership(address newOwner) public
```

Function for tranferring ownership to other address
Only owner can call this function

#### Parameters

| Name     | Type    | Description       |
| -------- | ------- | ----------------- |
| newOwner | address | New owner address |

### depositETH

```solidity
function depositETH() external payable
```

Allows users to deposit Ether into the vault. The deposited amount is recorded, and a Deposit event is emitted.

### withdrawETH

```solidity
function withdrawETH(uint256 amount) external
```

Allows users to withdraw their deposited Ether from the vault.

#### Parameters

| Name   | Type    | Description                                                                                                                   |
| ------ | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| amount | uint256 | The amount of Ether to withdraw. The function checks for sufficient balance, transfers the Ether, and emits a Withdraw event. |

### depositToken

```solidity
function depositToken(address token, uint256 amount) external
```

Allows users to deposit ERC20 tokens into the vault.

#### Parameters

| Name   | Type    | Description                                                                                                                                                         |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| token  | address | The address of the ERC20 token to deposit.                                                                                                                          |
| amount | uint256 | The amount of the token to deposit. The function checks for valid token address, transfers the tokens to the vault, updates the balance, and emits a Deposit event. |

### withdrawToken

```solidity
function withdrawToken(address token, uint256 amount) external
```

Allows users to withdraw their deposited ERC20 tokens from the vault.

#### Parameters

| Name   | Type    | Description                                                                                                                        |
| ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| token  | address | The address of the ERC20 token to withdraw.                                                                                        |
| amount | uint256 | The amount of the token to withdraw. The function checks for sufficient balance, transfers the tokens, and emits a Withdraw event. |

### wrapETH

```solidity
function wrapETH(uint256 amount) external
```

Allows users to convert their deposited Ether into WETH within the vault.

#### Parameters

| Name   | Type    | Description                                                                                                                                             |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amount | uint256 | The amount of Ether to wrap. The function checks for sufficient ETH balance, wraps the Ether into WETH, updates the balance, and emits a WrapETH event. |

### unwrapWETH

```solidity
function unwrapWETH(uint256 amount) external
```

Allows users to convert their deposited WETH back into Ether within the vault.

#### Parameters

| Name   | Type    | Description                                                                                                                                |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| amount | uint256 | The amount of WETH to unwrap. The function checks for sufficient WETH balance, unwraps the WETH into Ether, and emits an UnwrapWETH event. |

### receive

```solidity
receive() external payable
```

Special function to receive Ether. Restricted to only accept ETH from the WETH contract, likely during the unwrapping process.

### Additional Notes

- Contracts `MockWETH.sol` and `TestToken.sol` are for testing purpose, it will not be deployed.

- The contract utilizes the OpenZeppelin libraries for safe ERC20 token handling and reentrancy protection.

- Special care is taken to prevent potential issues such as double wrapping of WETH and ensuring that only WETH can send ETH to the contract during unwrapping.

- Users are responsible for managing their own balances and ensuring they have sufficient funds before making transactions.

- It's essential to interact with this contract using wallets or scripts that support the ERC20 and WETH standards for proper functioning.
