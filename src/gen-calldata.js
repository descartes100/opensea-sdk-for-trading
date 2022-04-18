/*
  Generate calldata that can be called onchain to buy NFT directly, not through Opensea SDK.
*/
import fs from 'fs';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
const yargs = _yargs(hideBin(process.argv));
import { OpenSeaPort, Network } from 'opensea-js';
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import HDWalletProvider from '@truffle/hdwallet-provider';
import { OrderSide } from 'opensea-js/lib/types.js';
import { assignOrdersToSides,
         estimateCurrentPrice,
         makeBigNumber} from 'opensea-js/lib/utils/utils.js';
import { isValidAddress } from "ethereumjs-util";
import { 
  NULL_BLOCK_HASH, 
  NULL_ADDRESS,
  INVERSE_BASIS_POINT
} from 'opensea-js/lib/constants.js';

const privateKey = process.env.ma1;
let tokenId, tokenAddress, accountAddress;

/**
  * Testnet configuration
*/
const rinkebyNet = process.env.rinkeby;
const apiKey = process.env.openseaApiTest;

let rinkebyProvider = new HDWalletProvider(
  {
    privateKeys: [privateKey], 
    providerOrUrl: rinkebyNet
  });

const seaport = new OpenSeaPort(rinkebyProvider, {
  networkName: Network.Rinkeby,
  apiKey: apiKey
});

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
  * A copy of Opensea sdk's private function "_getMetadata"
  * link "https://github.com/ProjectOpenSea/opensea-js/blob/d17ebe1d52ef5456dcfa264749c80c727b7f055b/src/seaport.ts#L4025"
*/
function _getMetadata(order) {
    const referrer = order.metadata.referrerAddress;
    if (referrer && isValidAddress(referrer)) {
      return referrer;
    }
    return undefined;
}

/**
  * A copy of Opensea sdk's private function "_getRequiredAmountForTakingSellOrder"
  * link "https://github.com/ProjectOpenSea/opensea-js/blob/d17ebe1d52ef5456dcfa264749c80c727b7f055b/src/seaport.ts#L4225"
*/
async function  _getRequiredAmountForTakingSellOrder(sell) {
    const currentPrice = await seaport.getCurrentPrice(sell);
    const estimatedPrice = estimateCurrentPrice(sell);

    const maxPrice = BigNumber.max(currentPrice, estimatedPrice);

    sell.takerRelayerFee = makeBigNumber(sell.takerRelayerFee);
    const feePercentage = sell.takerRelayerFee.div(INVERSE_BASIS_POINT);
    const fee = feePercentage.times(maxPrice);
    return fee.plus(maxPrice).integerValue(BigNumber.ROUND_CEIL);
}

/**
   * Get an order from the orderbook.
*/
async function getSellOrder(tokenAddress, token_id) {
  const { orders, _ } = await seaport.api.getOrders({
    asset_contract_address: tokenAddress,
    token_id: token_id,
    side: OrderSide.Sell
  });
  return(orders[0]);
}

/**
  * A mock of Opensea sdk's private function "atomicMatch"
  * link "https://github.com/ProjectOpenSea/opensea-js/blob/d17ebe1d52ef5456dcfa264749c80c727b7f055b/src/seaport.ts#L4033"
*/
async function matchCheck(buy, sell, accountAddress) {
  let shouldValidateBuy = true;
  let shouldValidateSell = true;
  let value;
  // Only check buy, but shouldn't matter as they should always be equal
  if (sell.maker.toLowerCase() == accountAddress.toLowerCase()) {
      // USER IS THE SELLER, only validate the buy order
      await seaport._sellOrderValidationAndApprovals({
        order: sell,
        accountAddress,
      });
      shouldValidateSell = false;
  } else if (buy.maker.toLowerCase() == accountAddress.toLowerCase())
  {
      // USER IS THE BUYER, only validate the sell order
      await seaport._buyOrderValidationAndApprovals({
        order: buy,
        counterOrder: sell,
        accountAddress,
      });
      shouldValidateBuy = false;

      // If using ETH to pay, set the value of the transaction to the current price
      if (buy.paymentToken == NULL_ADDRESS) {
        value = await _getRequiredAmountForTakingSellOrder(sell);
      }
  } 

  await seaport._validateMatch({
      buy,
      sell,
      accountAddress,
      shouldValidateBuy,
      shouldValidateSell,
  });
}

/**
  * A mock of Opensea sdk's "fulfillOrder" function
  * link "https://github.com/ProjectOpenSea/opensea-js/blob/d17ebe1d52ef5456dcfa264749c80c727b7f055b/src/seaport.ts#L1161"
  * @param order The order to fulfill, a.k.a. "take"
  * @param accountAddress The taker's wallet address
  * @returns WyvernAtomicMatchParameters to create encoded calldata.
*/
async function match(order, accountAddress) {
  const matchingOrder = seaport._makeMatchingOrder({
      order,
      accountAddress,
      recipientAddress:  accountAddress,
    });
  const { buy, sell } = assignOrdersToSides(order, matchingOrder);
  const metadata = _getMetadata(order);
  await matchCheck(buy, sell, accountAddress);
  const args = formatArgs(buy, sell, metadata);
  return args;
}

/**
  * use ethers.utils.Interface to create encode function data of "atomicMatch"
  * @param args The parameters of atomicMatch_ function
  * @returns data A hex string that can be used as the data for a transaction
*/
function encodeCalldata(args) {
  let ABI = [
    "function atomicMatch_(address[14] addrs, uint256[18] uints, uint8[8] feeMethodsSidesKindsHowToCalls, bytes calldataBuy, bytes calldataSell, bytes replacementPatternBuy, bytes replacementPatternSell, bytes staticExtradataBuy, bytes staticExtradataSell, uint8[2] vs, bytes32[5] rssMetadata) payable"
  ];
  let iface = new ethers.utils.Interface(ABI);
  let data = iface.encodeFunctionData("atomicMatch_", args);
  return data;
}

function formatBigNumber(arg) {
  var num = [];
  for (var x of arg) {
    num.push(x.toFixed());
  }
  return num;
}

/**
  * format the parameters in order.
*/
function formatArgs(buy, sell, metadata) {
  const nums = [
        buy.makerRelayerFee,
        buy.takerRelayerFee,
        buy.makerProtocolFee,
        buy.takerProtocolFee,
        buy.basePrice,
        buy.extra,
        buy.listingTime,
        buy.expirationTime,
        buy.salt,
        sell.makerRelayerFee,
        sell.takerRelayerFee,
        sell.makerProtocolFee,
        sell.takerProtocolFee,
        sell.basePrice,
        sell.extra,
        sell.listingTime,
        sell.expirationTime,
        sell.salt,
      ];
  const formatNum = formatBigNumber(nums);
  const args = [
      [
        buy.exchange,
        buy.maker,
        buy.taker,
        buy.feeRecipient,
        buy.target,
        buy.staticTarget,
        buy.paymentToken,
        sell.exchange,
        sell.maker,
        sell.taker,
        sell.feeRecipient,
        sell.target,
        sell.staticTarget,
        sell.paymentToken,
      ],
      formatNum,
      [
        buy.feeMethod,
        buy.side,
        buy.saleKind,
        buy.howToCall,
        sell.feeMethod,
        sell.side,
        sell.saleKind,
        sell.howToCall,
      ],
      buy.calldata,
      sell.calldata,
      buy.replacementPattern,
      sell.replacementPattern,
      buy.staticExtradata,
      sell.staticExtradata,
      [buy.v || 0, sell.v || 0],
      [
        buy.r || NULL_BLOCK_HASH,
        buy.s || NULL_BLOCK_HASH,
        sell.r || NULL_BLOCK_HASH,
        sell.s || NULL_BLOCK_HASH,
        metadata || NULL_BLOCK_HASH,
      ],
    ];
  return args;
}


async function testnetTry() {
  const arg = yargs
    .option('tokenAddress', {
        string: true
    })
    .option('accountAddress', {
        string: true
    })
    .option('tokenId', {
        string: true
    })
    .argv;
  
  tokenAddress = arg['tokenAddress'];
  tokenId = arg['tokenId'];
  accountAddress = arg['accountAddress'];
  const order = await getSellOrder(tokenAddress, tokenId);
  const params = await match(order, accountAddress);
  const content = encodeCalldata(params);
  fs.writeFile('src/calldata.txt', content, err => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

testnetTry()