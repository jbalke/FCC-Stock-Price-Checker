/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

var likes;

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          likes = res.body.stockData.likes || 0;
          assert.equal(res.status, 200);
          assert.isString(res.body.stockData.stock);
          assert.isString(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.likes, likes + 1);
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.likes, likes + 1);
          done();
        });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['amzn', 'ebay']})
        .end(function(err, res){
          var result = res.body;
          assert.equal(res.status, 200);
          assert.isArray(result.stockData);
          assert.equal(result.stockData[0].stock, 'AMZN');
          assert.equal(result.stockData[1].stock, 'EBAY');
          assert.isString(result.stockData[0].price);
          assert.isString(result.stockData[1].price);
          assert.equal(result.stockData[0].rel_likes, 0);
          assert.equal(result.stockData[1].rel_likes, 0);
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['amzn', 'ebay'], like: true})
        .end(function(err, res){
          var result = res.body;
          assert.equal(res.status, 200);
          assert.isArray(result.stockData);
          assert.equal(result.stockData[0].stock, 'AMZN');
          assert.equal(result.stockData[1].stock, 'EBAY');
          assert.isString(result.stockData[0].price);
          assert.isString(result.stockData[1].price);
          assert.equal(result.stockData[0].rel_likes, 0);
          assert.equal(result.stockData[1].rel_likes, 0);
          done();
        });
      });
      
    });

});
