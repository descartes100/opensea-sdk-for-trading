/*
  Buy NFT on rinkeby testnet through Opensea sdk.
*/

import { OpenSeaPort, Network } from 'opensea-js'
import HDWalletProvider from "@truffle/hdwallet-provider"

const privateKey = process.env.ma2
let tokenId, tokenAddress, accountAddress;

/**
  * Testnet configuration
*/
const rinkebyNet = process.env.rinkeby
const apiKey = process.env.openseaApiTest

let rinkebyProvider = new HDWalletProvider(
  {
    privateKeys: [privateKey], 
    providerOrUrl: rinkebyNet
  });

const seaport = new OpenSeaPort(rinkebyProvider, {
  networkName: Network.Rinkeby,
  apiKey: apiKey
})

/**
  * Mainnet configuration
*/
// const mainNet = process.env.mainnet;
// const apiKey = process.env.openseaApiMain;

// let mainProvider = new HDWalletProvider(
//   {
//     privateKeys: [privateKey], 
//     providerOrUrl: mainNet
//   });

// const seaport = new OpenSeaPort(mainProvider, {
//   networkName: Network.Main,
//   apiKey: apiKey
// });

/**
  * Get an buy order from the orderbook.
  * @param tokenAddress The NFT's token address.
  * @param token_id The NFT's token id.
  * @returns order The order on Opensea orderbook.
*/
async function getBuyOrder(tokenAddress, token_id) {
  const { orders, count } = await seaport.api.getOrders({
    asset_contract_address: tokenAddress,
    token_id: token_id,
    side: 0
  });
  return(orders[0]);
}

/**
  * Get an sell order from the orderbook.
  * @param tokenAddress The NFT's token address.
  * @param token_id The NFT's token id.
  * @returns order The order on Opensea orderbook.
*/
async function getSellOrder(tokenAddress, token_id) {
  const { orders, count } = await seaport.api.getOrders({
    asset_contract_address: tokenAddress,
    token_id: token_id,
    side: 1
  });
  return(orders[0]);
}


/**
  * Fullfill or "take" an order for an asset.
  * @param order The order to fulfill.
  * @param accountAddress The taker's wallet address
*/
async function buyItem(order, accountAddress) {
  const response = await seaport.fulfillOrder({order, accountAddress});
  return response;
}


/*
  buying process :
  1. get sell order 
  2. fulfill the order
*/

async function try1() {
  tokenAddress = "0x12EE22Fb3e55Ae219164AF8e37A7aE59c0A45858"
  tokenId = "3"
  accountAddress = "0x21E87C189cBadE700DC0FA07362FcE9c9AF64086";
  const order = await getSellOrder(tokenAddress, tokenId);
  console.log(order)
  var buy = await buyItem(order, accountAddress)
  console.log(buy)
}


try1()


