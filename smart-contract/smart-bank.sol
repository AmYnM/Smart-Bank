// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SmartBankToken is ERC20, Ownable {
    uint256 public rate = 100; 

    constructor(string memory name, string memory symbol, uint256 initialSupply) 
        ERC20(name, symbol) 
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function swapTokenForEther(uint256 tokenAmount) external {
        uint256 etherAmount = tokenAmount / rate;
        require(address(this).balance >= etherAmount, "Not enough Ether in contract");

        _burn(msg.sender, tokenAmount);
        payable(msg.sender).transfer(etherAmount);
    }

    // Allow the contract to receive Ether
    receive() external payable { }
}