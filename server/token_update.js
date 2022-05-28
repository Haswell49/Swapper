const axios = require("axios");
const { response } = require("express");

const Token = require("./models/Token");


// Token addresses
const eth = "0x2170ed0880ac9a755fd29b2688956bd959f933f8";
const btcb = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const wbnb = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const tokenAddresses = [eth, btcb, wbnb];

const NameAliases = {
    "Wrapped BNB": "Binance Coin",
    "BTCB Token": "Bitcoin",
    "Ethereum Token": "Ethereum"
}

const ShortNameAliases = {
    "WBNB": "BNB",
    "BTCB": "BTC",
    "ETH": "ETH"
}

async function getPancakeSwapTokenData(tokenAddress) {
    const response = await axios.get(`https://api.pancakeswap.info/api/v2/tokens/${tokenAddress}`);
    return response.data
}

function generateNewToken(tokenData) {
    return new Token({
        name: NameAliases[tokenData["name"]],
        short_name: ShortNameAliases[tokenData["symbol"]],
        img: "",
        price: +Number(tokenData["price"]).toFixed(2),
        change_is: "up"
    });
}

function modifyToken(token, tokenData) {
    token.change_price = +(token.price - Number(tokenData["price"])).toFixed(2);

    if (token.change_price >= 0.0) {
        token.change_is = "up";
    } else {
        token.change_is = "down";
    }

    token.price = +Number(tokenData["price"]).toFixed(2);
}

module.exports = {
    updateTokens: function () {
        for (tokenAddress of tokenAddresses) {
            getPancakeSwapTokenData(tokenAddress).then(response => {
                Token.findOne({ name: NameAliases[response.data["name"]] }, (err, token) => {
                    if (token) {
                        modifyToken(token, response.data);
                    } else {
                        newToken = generateNewToken(response.data);
                        newToken.save();
                    }
                });
            });
        }
    }
}
