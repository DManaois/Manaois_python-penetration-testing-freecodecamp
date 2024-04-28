'use strict';
const Stock = require("./models").Stock;

async function createStock(stock, like, ip) {
    const newStock = new Stock({
        symbol: stock,
        likes: like ? [ip] : [],
    });
    const savedNew = await newStock.save();
    return savedNew;
}

async function findStock(stock) {
    return await Stock.findOne({ symbol: stock }).exec();
}

async function saveStock(stock, like, ip) {
    let saved = {};
    const foundStock = await findStock(stock);
    if (!foundStock) {
        const createSaved = await createStock(stock, like, ip);
        saved = createSaved;
        return saved;
    } else {
        if (like && foundStock.likes.indexOf(ip) === -1) {
            foundStock.likes.push(ip);
            saved = await foundStock.save();
        }
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
            if (Array.isArray(stock) && stock.length === 2) {
                const [symbol1, symbol2] = stock;
                const { symbol: symbol1Name, latestPrice: latestPrice1 } = await getStock(symbol1);
                const { symbol: symbol2Name, latestPrice: latestPrice2 } = await getStock(symbol2);

                await saveStock(symbol1, like, req.ip);
                await saveStock(symbol2, like, req.ip);

                const relLikes1 = like === 'true' ? 1 : 0;
                const relLikes2 = like === 'true' ? 1 : 0;

                let stockData = [];
                stockData.push({
                    stock: symbol1Name,
                    price: latestPrice1,
                    rel_likes: relLikes1,
                });
                stockData.push({
                    stock: symbol2Name,
                    price: latestPrice2,
                    rel_likes: relLikes2,
                });

                res.json({
                    stockData,
                });
                return;
            }

            const { symbol, latestPrice } = await getStock(stock);
            const likes = like === 'true' ? 1 : 0;
            res.json({ stockData: { stock, price: latestPrice, likes } });
        });
};
