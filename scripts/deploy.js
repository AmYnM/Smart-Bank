const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Check balance
    // const balance = await deployer.getBalance();
    // console.log("Account balance:", balance.toString());

    const Token = await ethers.getContractFactory("SmartBankToken");
    const token = await Token.deploy("SmartBankToken", "SBT", 100000);

    await token.waitForDeployment();

    console.log("Token deployed to:", token.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error deploying the contract',error);
        process.exit(1);
    });