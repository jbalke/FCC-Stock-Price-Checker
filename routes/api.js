/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var stockHandler = require('../controllers/stockHandler.js');

// const instance = axios.create({
//   baseURL: 'https://www.alphavantage.co/'
// });

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  MongoClient.connect(CONNECTION_STRING, function(err, db) {
    console.log('database connected');
    
      app.route('/api/stock-prices')
      .get(stockHandler.stock(db));

    //404 Not Found Middleware
    app.use(function(req, res, next) {
      res.status(404)
        .type('text')
        .send('Not Found');
    });
  });
};
