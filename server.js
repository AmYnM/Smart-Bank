require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const contractArtifacts = require('./artifacts/smart-contract/smart-bank.sol/SmartBankToken.json');
const connectDB = require('./config/database');
const ContractSave = require('./model/database');

const app = express();
app.use(express.json());

connectDB();

// Configure your Ethereum provider (e.g., Infura)
const sepolia_url = process.env.SEPOLIA_URL.replace(/^['"]|['"]$/g, '').trim();;
console.log(sepolia_url);
// const provider = new ethers.JsonRpcProvider(sepolia_url);
const privateKey = process.env.PRIVATE_KEY;
// const signer = new ethers.Wallet(privateKey, provider);

let provider;
let signer;
let contract = null;
let deployedContractAddress = null;

// Function to initialize provider and signer
async function initializeProviderAndSigner() {
    try {
        console.log('Attempting to connect with URL:', sepolia_url);
        provider = new ethers.JsonRpcProvider(sepolia_url);
        // await provider.ready;
        // console.log('Successfully connected to the Ethereum network');
        
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.name);

        console.log('Initializing signer...');
        // Initialize wallet (replace with your private key)
        signer = new ethers.Wallet(privateKey, provider);
    } catch (error) {
        console.error('Failed to connect to the Ethereum network:', error);
        throw error;
    }
}

// Initialize provider and signer when the server starts
initializeProviderAndSigner().catch(console.error);

// Middleware to check if provider and signer are initialized
const requireConnection = async (req, res, next) => {
    if (!provider || !signer) {
        try {
            await initializeProviderAndSigner();
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Failed to connect to the Ethereum network' });
        }
    } else {
        next();
    }
};
// Middleware to check if contract is deployed
const requireContract = (req, res, next) => {
    if (!contract) {
        return res.status(400).json({ error: 'Contract not deployed yet' });
    }
    next();
};

app.post('/deploy', requireConnection, async (req, res) => {
    try {
        const { name, symbol, initialSupply } = req.body;
        const factory = new ethers.ContractFactory(contractArtifacts.abi, contractArtifacts.bytecode, signer);
        console.log(`Deploying contract with name: ${name}, symbol: ${symbol}, initial supply: ${initialSupply}`);
        const deployedContract = await factory.deploy(name, symbol, initialSupply);
        await deployedContract.waitForDeployment();
        deployedContractAddress = await deployedContract.getAddress();
        contract = deployedContract;
        const newContract = new ContractSave({
            address: deployedContractAddress,
            name: name,
            symbol: symbol,
            initialSupply: initialSupply 
        });
        await newContract.save();
        console.log(`Contract deployed at: ${deployedContractAddress}`);
        res.json({ address: deployedContractAddress });
    } catch (error) {
        console.error('Error deploying contract:', error);
        res.status(500).json({ error: 'Failed to deploy the token', details: error.message });
    }
});

app.post('/api/swapTokenForEther', requireConnection, requireContract, async (req, res) => {
    try {
        const { tokenAmount } = req.body;

        if (!tokenAmount || isNaN(tokenAmount)) {
            return res.status(400).json({ error: 'Invalid token amount provided' });
        }

        const tokenAmountWei = ethers.parseUnits(tokenAmount.toString(), 18);

        // Call the swapTokenForEther function on your contract
        const tx = await contract.swapTokenForEther(tokenAmountWei);
        const receipt = await tx.wait();

        res.json({
            success: true,
            message: `Swapped ${tokenAmount} tokens for ETH`,
            transactionHash: receipt.hash
        });
    } catch (error) {
        console.error('Error during token swap:', error);
        res.status(500).json({ error: 'Failed to swap tokens for ETH', details: error.message });
    }
});

app.get('/api/contractBalance', requireConnection, requireContract, async (req, res) => {
    try {
        const balance = await provider.getBalance(deployedContractAddress);
        res.json({
            balance: ethers.formatEther(balance)
        });
    } catch (error) {
        console.error('Error fetching contract balance:', error);
        res.status(500).json({ error: 'Failed to fetch contract balance', details: error.message });
    }
});

app.post('/addEther', async (req, res) => {
    try {
        if (!contract) {
            return res.status(400).json({ error: 'Smart contract not deployed' });
        }
        const tx = await signer.sendTransaction({
            to: await contract.getAddress(),
            value: ethers.parseEther('1')
        });
        await tx.wait();
        res.json({ txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/balance/:address', async (req, res) => {
    try {
        if (!contract) {
            return res.status(400).json({ error: 'Smart contract not deployed' });
        }

        const balance = await provider.getBalance(await contract.getAddress());
        res.json({ balance: ethers.formatEther(balance) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));