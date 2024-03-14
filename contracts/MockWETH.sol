// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWETH is ERC20 {
    constructor() ERC20("Wrapped Ether", "WETH") {}

    // Mimic the deposit function of the WETH contract
    function deposit() public payable {
        _mint(msg.sender, msg.value);
    }

    // Mimic the withdraw function of the WETH contract
    function withdraw(uint amount) public {
        require(
            balanceOf(msg.sender) >= amount,
            "MockWETH: insufficient balance"
        );
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    // Allow contract to receive Ether
    receive() external payable {}
}
