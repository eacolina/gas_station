// This service will listen for transactions on the xDai network
if(process.env.NODE_ENV != 'production'){
    require('dotenv').load()
}

var HDWalletProvider = require("truffle-hdwallet-provider")
var Web3 = require('Web3')
var web3
var eth
var utils 
var BURN_ABI = require('./BurnTokenABI.json')
var xDaiEmitterContract
var lastEventBlock = 1909278// always update this
var tokenHolders = {} // this dict will hold all the BURN token owners and their balance
const xdaiEndpoint = process.env.RPC_ENDPOINT
var account
var dropAmount 

// Returns a wallet provider pointing to the xDai RPC
function xDaiproviderSetup(){
    return new HDWalletProvider(process.env.WALLET_MNEMONIC, process.env.RPC_ENDPOINT)
}

async function initXDAIService() {
    console.log("Starting xDAI service...")
    web3 = new Web3(new HDWalletProvider(process.env.WALLET_MNEMONIC, process.env.RPC_ENDPOINT)) // create a web3 object with xDai endpoint
    eth = web3.eth
    utils = web3.utils
    dropAmount = utils.toWei('0.02') // this is har coded to 2 cents for now
    account = (await web3.eth.getAccounts())[0] // TODO setup with proper account for DAI pool
    xDaiEmitterContract = new eth.Contract(BURN_ABI, process.env.TOKEN_ADDRESS, {from: account})
    getInitialOwners() //
    setTimeout(logOwners,40000) // pwait 40 secs to get all the owners
}

function logOwners(){
    console.log(tokenHolders) // log the results
    console.log("Starting to poll")
    getTransferEvents() // start polling
}

async function getInitialOwners(){
    xDaiEmitterContract.getPastEvents("Transfer",{fromBlock:lastEventBlock, toBlock:'latest'},TransferCBInitial)
}
// this will poll every 150ms for new Transfer events
function getTransferEvents(){
    // Get all the past "FundsSent" events
    xDaiEmitterContract.getPastEvents("Transfer",{fromBlock:lastEventBlock, toBlock:'latest'},TransferCB)
    setTimeout(getTransferEvents,150) // poll every 150ms 
}



async function TransferCBInitial(err, res){
    if(err){
        console.log("There was an error with the RPC endpoint")
    } else {
        var latest_block = (res[res.length - 1]).blockNumber
        if(latest_block > lastEventBlock) {
            lastEventBlock = latest_block // so that next time we only get events starting from that block
            for(var i = 0; i < res.length; i++){
                var address = res[i].returnValues.to
                if(!(address in tokenHolders)){
                    tokenHolders[address] = await eth.getBalance(address)
                }
            }
        }
    }
}
async function TransferCB(err, res){
    if(err){
        console.log("There was an error with the RPC endpoint")
    } else {
        var latest_block = (res[res.length - 1]).blockNumber
        if(latest_block > lastEventBlock) {
            console.log("Heard something")
            lastEventBlock = latest_block // so that next time we only get events starting from that block
            for(var i = 0; i < res.length; i++){
                var address = res[i].returnValues.to
                if(!(address in tokenHolders)){
                    var balance = await eth.getBalance(address)
                    tokenHolders[address] = balance
                    if(balance == 0){
                        supplyGas(address)
                    }
                }
            }
        }
    }
}


async function supplyGas(dest_account){
    eth.sendTransaction({from:account, to:dest_account, value: dropAmount, gas:210000, gasPrice:20000000000}).then((res) => {
        console.log("Just sent", dropAmount, "DAI to account", dest_account)
        console.log('TxHash:',res.transactionHash)
    }).catch((err) => {
        console.error("There was an error sending the funds: ", err,"\n")
    })
}


initXDAIService()