const axios = require('axios');
const API_KEY = process.env.API_KEY;
const STOCK_EXPIRY_SECONDS = 60;

axios.defaults.baseURL = 'https://www.alphavantage.co';

function parseBoolean(val) {
   return val === 'true' || val === true; 
}

function parseDBDoc(doc) {
  var {stock, price } = doc;
  var likes = doc.IPAddresses.length - 1;
  return { stock, price, likes };
}

async function queryAPI(symbol) {
  try {
    var result = await axios.get(`/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
    if (result) {
      var { data:{ "Global Quote":{ "01. symbol": stock, "05. price": price }}} = result;
      return {stock, price};
    } else {
      throw new Error('Unknown stock symbol');
    }
  }
  catch(err) {
    throw err;
  }
} 

function fetchStock(db, stock, IPAddress, like = false, ageInSeconds = STOCK_EXPIRY_SECONDS) {
  stock = stock.toUpperCase();
  
  var addToSet = { $addToSet: { IPAddresses: 'null' }}
  if (like) {
    addToSet = { $addToSet: { IPAddresses: {$each: [IPAddress, 'null'] }}}
  }
  
  return new Promise(function(resolve, reject) {
    //Check if we have queried this stock before...
    db.collection('stocks').findOne({ stock }, { '_id': 0 })
    .then(result => {
      if (result) {
        //Stock is in DB...
        var { price, likes, lastModified } = result;
        let ageInMS = ageInSeconds * 1000;
        
        // check lastmodified and query new price if stale - the alphavantage api throttles queries when using free key.
        if (!lastModified || (lastModified && (Date.now() - lastModified.valueOf() >= ageInMS))) {
          queryAPI(stock)
          .then(stockData => {
            var { price } = stockData;
            
            db.collection('stocks').findOneAndUpdate({ stock }, {$set: { price }, $currentDate: { lastModified: true }, ...addToSet}, {projection: { '_id': 0, lastModified: 0 }, upsert: true, returnOriginal: false })
            .then(result => {
              return resolve(parseDBDoc(result.value));
            });
          })
          .catch(err => {
            return reject(err);
          });
        } else {
          //Found recent stock entry in DB, update likes/IPAddresses
          db.collection('stocks').findOneAndUpdate({ stock }, { ...addToSet }, { projection: { '_id': 0, lastModified: 0 }, returnOriginal: false})
          .then(result => {
            return resolve(parseDBDoc(result.value));
          })
          .catch(err => {
            return reject(err);
          });
        }
      } else {
        queryAPI(stock)
        .then(stockData => {
          var { price } = stockData;

          db.collection('stocks').findOneAndUpdate({ stock }, { $set: { price }, $currentDate: { lastModified: true }, ...addToSet}, {projection: { '_id': 0, 'lastModified': 0 }, upsert: true, returnOriginal: false })
          .then(result => {
            return resolve(parseDBDoc(result.value));
          });
        })
        .catch(err => {
          return reject(err);
        });
      }
    })
    .catch(err => {
      return reject(err);
    });
  });
}

exports.stock = function(db){
  return function(req, res) {
    let { stock, like } = req.query;
    let { ip } = req;
    
    //reduce multiple likes to single boolean
    if (like && Array.isArray(like)) {
      like = like.reduce((acc, val) => { val = parseBoolean(val) ? 1 : -1; return acc + val }, 0);
      like = like >= 1; 
    } else {
      like = parseBoolean(like);
    }
    
    //If comparing multiple stocks...
    if (stock && Array.isArray(stock)) {
      if (stock.length != 2) {
        return res.type('txt').send('must provide only two stock symbols');
      }
      
      Promise.all(stock.map(symbol => fetchStock(db, symbol, ip, like)))
      .then(responses => {
        var returnData = responses.map((val ,i) => ({ stock: val.stock, price: val.price, rel_likes: val.likes - responses[(i+1)%2].likes }));
        res.json({ stockData: returnData });
      })
      .catch(err => {
        console.log(err);
      });
    } else {
      fetchStock(db, stock, ip, like)
      .then(stock => {
        res.json({ stockData: stock });
      })
      .catch(err => {
        console.log(err);
      })
    }
  }
}