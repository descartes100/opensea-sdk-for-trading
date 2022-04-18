/*
  Create sell order, create buy order and cancel order
  on rinkeby through Opensea sdk.
*/
import { OpenSeaPort, Network } from 'opensea-js'
import HDWalletProvider from "@truffle/hdwallet-provider"

const privateKey = process.env.ma1
let tokenId, tokenAddress, accountAddress, price

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
  * Get an buy or sell order from the orderbook.
  * @param tokenAddress The NFT's token address.
  * @param token_id The NFT's token id.
  * @returns order The order on Opensea orderbook.
*/
async function getOrder(tokenAddress, token_id, side) {
  const { orders, count } = await seaport.api.getOrders({
    asset_contract_address: tokenAddress,
    token_id: token_id,
    side: side
  });
  return(orders[0]);
}

/**
  * Create a buy order to make an offer on an asset.
  * @param tokenId The NFT's token id.
  * @param tokenAddress The NFT's token address.
  * @param accountAddress Address of the maker's wallet.
  * @param price Value of the offer.
  * @returns offer The created buy order on orderbook.
*/
async function createBuy(tokenId, tokenAddress, accountAddress, price){
  const offer = await seaport.createBuyOrder({
    asset: {
      tokenId,
      tokenAddress,
    },
    accountAddress,
    startAmount: price,
  })
  return(offer)
}

/**
  * Create a sell order to auction an asset.
  * @param tokenId The NFT's token id.
  * @param tokenAddress The NFT's token address.
  * @param accountAddress Address of the maker's wallet.
  * @param price Price of the asset at the start of the auction. 
  * @returns listing The created sell order on orderbook.
  * Ignoring the endAmount will create an fixed price sell order.
*/
async function createSell(tokenId, tokenAddress, accountAddress, price) {
  const listing = await seaport.createSellOrder({
      asset: {
        tokenId,
        tokenAddress,
      },
      accountAddress,
      startAmount: price,
    })
  return listing;
}

/**
  * Cancel an order on-chain, preventing it from ever being fulfilled.
  * @param order The order to cancel.
  * @param accountAddress The order maker's wallet address.
*/
async function cancelOrder(order, accountAddress) {
  const cancel = await seaport.cancelOrder({
    order: order,
    accountAddress: accountAddress
  })
  return cancel;
}

/*
  a test try to create buy order.
*/
async function try1() {
  tokenId = "5770"
  tokenAddress = "0x16baF0dE678E52367adC69fD067E5eDd1D33e3bF"
  accountAddress = "0x21E87C189cBadE700DC0FA07362FcE9c9AF64086"

  var offer = await createBuy(tokenId, tokenAddress, accountAddress, 0.1)
  console.log(offer)
}

/*
  a test try to create sell order.
*/
async function try2() {
  tokenAddress = "0x12EE22Fb3e55Ae219164AF8e37A7aE59c0A45858"
  tokenId = "3";
  accountAddress = "0x4403FA593AE60B3Ac0570ce5936C9Fa2f04b1474";
  price = 0.1;

  var list = await createSell(tokenId, tokenAddress, accountAddress, price)
  console.log(list)
}

/*
  A test try to cancel order.
*/
async function try3() {
  tokenAddress = "0x12EE22Fb3e55Ae219164AF8e37A7aE59c0A45858"
  tokenId = "3"
  accountAddress = "0x21E87C189cBadE700DC0FA07362FcE9c9AF64086";
  const order = await getOrder(tokenAddress, tokenId, 1);
  const cancel = await cancelOrder(order, accountAddress);
}


try3()



