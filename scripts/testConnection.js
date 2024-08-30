require('dotenv').config();

const { ethers } = require('ethers');

async function testConnection() {
    try {
        const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
        console.log(provider);
        const blockNumber = await provider.getBlockNumber();
        console.log("Connected to rinkeby Block Number:", blockNumber);
    } catch (error) {
        console.error("Connection Failed", error);
    }
}

testConnection();