// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";

/**
 * Vault Contract
 * =========
 * A simple vault contract which fulfil below purpose
 *
 *  - Users may deposit and later withdraw ETH. They may not withdraw more than they have individually deposited (no negative balances).
 *  - Users may deposit and withdraw ERC20 tokens of their choosing. Again, they may not withdraw more than they have deposited of a given token.
 *  - After depositing ETH, users may wrap their ETH into WETH within the vault (i.e. without first withdrawing). Similarly, users may unwrap their WETH into ETH within the vault.
 *
 */
contract Vault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * WETH address
     */
    IWETH public immutable weth;

    /**
     * Mapping between user address and balance of each ERC20 token
     */
    mapping(address => mapping(address => uint256)) private deposits; // user -> token -> amount

    /**
     * Mapping between user address and ETH balance
     */
    mapping(address => uint256) private ethDeposits; // user -> ETH amount

    /**
     * Emitted when user deposits any token
     */
    event Deposit(address indexed user, address indexed token, uint256 amount);

    /**
     * Emitted when user withdraws any token
     */
    event Withdraw(address indexed user, address indexed token, uint256 amount);

    /**
     * Emitted when the ETH is unwrapped
     */
    event WrapETH(address indexed user, uint256 amount);

    /**
     * Emitted when the ETH is unwrapped
     */
    event UnwrapWETH(address indexed user, uint256 amount);

    /**
     * Constructs the Vault contract.
     * @param _weth The address of the WETH (Wrapped Ether) contract.
     */
    constructor(address _weth) Ownable(msg.sender) {
        require(_weth != address(0), "WETH address cannot be 0");
        weth = IWETH(_weth);
    }

    /**
     * Returns the ETH deposit of a user.
     * @param user The address of the user.
     * @return The ETH deposit of the user.
     */
    function getEthDeposit(
        address user
    ) external view onlyOwner returns (uint256) {
        return ethDeposits[user];
    }

    /**
     * Returns the deposit of a user for a specific token.
     * @param user The address of the user.
     * @param token The address of the ERC20 token.
     * @return The deposit of the user for the specified token.
     */
    function getDeposit(
        address user,
        address token
    ) external view onlyOwner returns (uint256) {
        return deposits[user][token];
    }

    /**
     * Function for tranferring ownership to other address
     * Only owner can call this function
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * Allows users to deposit Ether into the vault. The deposited amount is recorded, and a Deposit event is emitted.
     */
    function depositETH() external payable {
        ethDeposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, address(0), msg.value);
    }

    /**
     * Allows users to withdraw their deposited Ether from the vault.
     * @param amount The amount of Ether to withdraw.
     * The function checks for sufficient balance, transfers the Ether, and emits a Withdraw event.
     */
    function withdrawETH(uint256 amount) external nonReentrant {
        require(ethDeposits[msg.sender] >= amount, "Insufficient balance");
        ethDeposits[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit Withdraw(msg.sender, address(0), amount);
    }

    /**
     * Allows users to deposit ERC20 tokens into the vault.
     * @param token The address of the ERC20 token to deposit.
     * @param amount The amount of the token to deposit.
     * The function checks for valid token address, transfers the tokens to the vault, updates the balance, and emits a Deposit event.
     */
    function depositToken(address token, uint256 amount) external {
        require(
            token != address(0) && token != address(weth), // avoid double wrapping
            "Invalid token address"
        );
        deposits[msg.sender][token] += amount;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, token, amount);
    }

    /**
     * Allows users to withdraw their deposited ERC20 tokens from the vault.
     * @param token The address of the ERC20 token to withdraw.
     * @param amount The amount of the token to withdraw.
     * The function checks for sufficient balance, transfers the tokens, and emits a Withdraw event.
     */
    function withdrawToken(
        address token,
        uint256 amount
    ) external nonReentrant {
        require(deposits[msg.sender][token] >= amount, "Insufficient balance");
        deposits[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, token, amount);
    }

    /**
     * Allows users to convert their deposited Ether into WETH within the vault.
     * @param amount The amount of Ether to wrap.
     * The function checks for sufficient ETH balance, wraps the Ether into WETH, updates the balance, and emits a WrapETH event.
     */
    function wrapETH(uint256 amount) external nonReentrant {
        require(ethDeposits[msg.sender] >= amount, "Insufficient ETH balance");
        ethDeposits[msg.sender] -= amount;
        weth.deposit{value: amount}();
        deposits[msg.sender][address(weth)] += amount;
        emit WrapETH(msg.sender, amount);
    }

    /**
     * Allows users to convert their deposited WETH back into Ether within the vault.
     * @param amount The amount of WETH to unwrap.
     * The function checks for sufficient WETH balance, unwraps the WETH into Ether, and emits an UnwrapWETH event.
     */
    function unwrapWETH(uint256 amount) external nonReentrant {
        require(
            deposits[msg.sender][address(weth)] >= amount,
            "Insufficient WETH balance"
        );
        deposits[msg.sender][address(weth)] -= amount;
        weth.withdraw(amount);
        ethDeposits[msg.sender] += amount;
        emit UnwrapWETH(msg.sender, amount);
    }

    /**
     * Special function to receive Ether. Restricted to only accept ETH from the WETH contract, likely during the unwrapping process.
     */
    receive() external payable {
        require(msg.sender == address(weth), "Only WETH can send ETH");
    }
}
