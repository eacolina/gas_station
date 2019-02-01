module.exports = {
    startPolling: startPolling
}

// This service will listen for transactions on the xDai network
if (process.env.NODE_ENV != 'production') {
    require('dotenv').load()
}

const DROP_AMOUNT = '0.02' // amount that should be droped to the new token holder
let TOKEN_ABI = require('./../artifacts/BurnTokenABI.json')
var tokenContract
var lastEventBlock = 1909278 // always update this
var tokenHolders = {} // this dict will hold all the BURN token owners and their balance
var dropAmount
var doneFirstRun = false
var log = true
var eth
var utils
var account

async function startPolling(web3Service) {
    eth = web3Service.eth
    utils = web3Service.utils
    account = (await eth.getAccounts())[0]
    dropAmount = utils.toWei(DROP_AMOUNT)
    console.log("Starting GasDrop component...")
    tokenContract = new web3Service.eth.Contract(TOKEN_ABI, process.env.TOKEN_ADDRESS, {
        from: account
    })
    console.log(account)
    console.log("Getting initial owners of the token")
    getTransferEvents() //
}

async function getTransferEvents() {
    tokenContract.getPastEvents("Transfer", {
        fromBlock: lastEventBlock,
        toBlock: 'latest'
    }, TransferCB)
    if (doneFirstRun) { // do a first run to get all the token holders
        if (log) {
            console.log(tokenHolders)
            console.log("Starting to poll")
            log = false
        }
        setTimeout(getTransferEvents, 150)// after that just poll every 150ms
    } else {
        setTimeout(getTransferEvents, 40000)
    }
}

// Callback function for the Transfer event listener
async function TransferCB(err, res) {
    if (err) {
        console.log("There was an error with the RPC endpoint")
    } else {
        var latest_block = (res[res.length - 1]).blockNumber // get the latest event block number
        if (latest_block > lastEventBlock) { // check if the recived block is actually higher that the previous one
            lastEventBlock = latest_block // so that next time we only get events starting from that block
            for (var i = 0; i < res.length; i++) { // loop through the most recent events
                var address = res[i].returnValues.to // address of the recepient of the transfer
                if (!(address in tokenHolders)) { // this way it will only send gas to brand new token holders not the "old ones" that ran out of gas 
                    var balance = await eth.getBalance(address)
                    tokenHolders[address] = balance // save the balance
                    if (balance == 0) { // if balance is 0 then send the dropAmount to cover the gas fees
                        supplyGas(address)
                        tokenHolders[address] = utils.toWei('0.02')
                    }
                }
            }
        }
        doneFirstRun = true // flag to stop start polling
    }
}
//supplyGas(dest_account): Sends the dropAmount of Ether/xDai to dest account
async function supplyGas(dest_account) {
    console.log(account)
    var nonce = await eth.getTransactionCount(account) // get nonce to send the tx
    eth.sendTransaction({
        from: account,
        to: dest_account,
        value: dropAmount,
        gas: 210000,
        gasPrice: 20000000000,
        nonce: nonce
    }, (err, res) => {
        if (err != undefined) {
            console.log(err)
        } else {
            console.log("Just sent", utils.fromWei(dropAmount), "xDAI to account", dest_account)
            console.log('TxHash:', res)
        }
    })
}
