


if(process.env.NODE_ENV != 'production'){
    require('dotenv').load()
}

var HDWalletProvider = require("truffle-hdwallet-provider")
var Web3 = require('Web3')
var web3
var eth
var utils 
var account

function providerSetup(){
    return new HDWalletProvider(process.env.WALLET_MNEMONIC, process.env.RPC_ENDPOINT)
}

async function init() {
    console.log("Creating Web3 provider...")
    web3 = new Web3(new HDWalletProvider(process.env.WALLET_MNEMONIC, process.env.RPC_ENDPOINT)) // create a web3 object with xDai endpoint
    return web3
}


module.exports = {
    init:init,
}