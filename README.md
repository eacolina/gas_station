# ⛽ Gas Station is a tool that will help you provide gas to your new token holders so that they can start using your token right away!

## How to run this app:
- Clone this repo
- Create a .env file in the root directory of the repo and assing the following environmment variables
    ```
    WALLET_MNEMONIC=MENMONIC FOR THE ACCOUNT THAT WILL SEND THE GAS
    TRUFFLE_WALLET_MNEMONIC=MENMONIC USED FOR YOUR TRUFFLE PROJECT
    TOKEN_ADDRESS=ADDRESS OF YOUR TOKEN
    RPC_ENDPOINT=RPC ENDPOINT FOR THE NETWORK WHERE YOUR TOKEN LIVES
    ```
- Start the app:
    ```
    npm start
    ```