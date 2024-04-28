'use strict';
const Stock = require("./models").Stock;

async function createStock(stock, like, ip) {
  const newStock = new Stock({
    symbol: stock,
    likes: like ? [ip] : [], // Always initialize likes as an array
  });const mongoose = require("mongoose");
const { Schema } = mongoose;

const StockSchema = new Schema({
    symbol: { type: String, required: true },
    likes: { type: [String], default: [] },
});

const Stock = mongoose.model("Stock", StockSchema);

exports.Stock = Stock;

  const savedNew = await newStock.save();
  return savedNew;
}


async function findStock(stock) {
  return await Stock.findOne ({symbol: stock}).exec();
}


async function saveStock(stock, like, ip) {
  let saved = {};
  const foundStock = await findStock(stock);
  if (!foundStock) {
      const createSaved = await createStock(stock, like, ip);
      saved = createSaved;
      return saved;
  } else {
      if (foundStock.likes && like && foundStock.likes.indexOf(ip) === -1) {
          foundStock.likes.push(ip);
      }
      saved = await foundStock.save();
      return saved;
  }
}





async function getStock(stock) {
    const fetch = await import('node-fetch');
    const response = await fetch.default(
        `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
    );
    const { symbol, latestPrice } = await response.json();
    return { symbol, latestPrice };
}




module.exports = function (app) {
  app.route('/api/stock-prices')
      .get(async function (req, res) {
          const { stock, like } = req.query;
          if (Array.isArray(stock)) {
            console.log ("stocks", stock);

            const {symbol, latestPrice} = await getStock (stock [0]);
            const {symbol: symbol2, latestPrice: latestPrice2} = await getStock(
              stock [1]
            );

            const firststock = await saveStock(stock[0], like, req.ip);
            const secondstock = await saveStock(stock[1], like, req.ip);

            let stockData = [];
            if(!symbol){
              stockData.push({
                rel_likes: firststock.likes.length - secondstock.likes.length,

              });
            } else {
              stockData.push({
                stock: symbol,
                price: latestPrice,
                rel_likes: firststock.likes.length - secondstock.likes.length,
              });
            }


            if(!symbol2){
              stockData.push({
                rel_likes: secondstock.likes.length - firststock.likes.length,

              });
            } else {
              stockData.push({
                stock: symbol2,
                price: latestPrice2,
                rel_likes: secondstock.likes.length - firststock.likes.length,
              });
            }
            
            res.json({
              stockData,
            });
            return;
            



          }
          const fetch = await import('node-fetch');
          const response = await fetch.default(
              `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
          );
          const { symbol, latestPrice } = await response.json();
          const likes = like === 'true' ? 1 : 0; // Check if like is 'true'
          res.json({ stockData: { stock, price: latestPrice, likes } });
      });
};
