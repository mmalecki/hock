var assert = require('assert'),
    async = require('async'),
    request = require('request'),
    cb = require('assert-called'),
    hock = require('../');

var PORT = 5678;

var mock = hock(PORT, cb(function () {
  mock
    .get('/url')
      .reply(200, { 'hock': 'ok' })
    .post('/post', { 'hock': 'post' })
      .reply(201, { 'hock': 'created' });

  async.parallel([
    function (done) {
      request('http://localhost:' + PORT + '/url', cb(function (err, res, body) {
        assert(!err);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(JSON.parse(body), { 'hock': 'ok' });
        done();
      }));
    },
    function (done) {
      request({
        method: 'POST',
        url: 'http://localhost:' + PORT + '/post',
        json: { 'hock': 'post' }
      }, cb(function (err, res, body) {
        assert(!err);
        assert.equal(res.statusCode, 201);
        assert.deepEqual(body, { 'hock': 'created' });
        done();
      }));
    }
  ], function () {
    mock.close();
  });
}));
