# **opensea-sdk**
use opensea sdk to generate calldata, create buy order, create sell order and cancel order.

# Installation

```
npm install
```

# Configurate Environment variables

You need to create an '.env' file to configurate 
```
privateKey
rinkeby provider url
mainner provider url
opensea api key
```

# Usage 
1. Generate calldata for Opensea 'atomicMatch_' function.

   Output would exist in 'src/calldata.txt'.
   
   **Arguments**
   * tokenAddress: the address of the opensea NFT
   * tokenId: the token id of the opensea NFT
   * accountAddress: the buyer of the NFT, can be an EOA or a contract address
   
   **Example**
   ```
   node src/gen-calldata.js --tokenId="3" --tokenAddress="0x12EE22Fb3e55Ae219164AF8e37A7aE59c0A45858" --accountAddress="0xB84F9393e064762b3B3FB4e35B6c89871aB122b6"
   ```

2. Create buy, sell and cancel order using opensea's sdk.
   
   You need to change the parameters in 'src/make-offer.js' manually.
   
   **Example**
   ```
   node src/make-offer.js
   ```

3. Fulfill buy order using opensea's sdk.

   You need to change the parameters in 'src/fulfill-buynow-order.js' manually.
   
   **Example**
   ```
   node src/fulfill-buynow-order.js
   ```
