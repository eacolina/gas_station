var GasDropComponent = require('./components/GasDrop.js')
var Web3Service = require('./services/Web3Service')

async function main() {
    console.log("Starting application...")
    var web3Service = await Web3Service.init()
    GasDropComponent.startPolling(web3Service)
}

main()
