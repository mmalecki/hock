var assert = require('assert'),
    request = require('request'),
    cb = require('assert-called'),
    hock = require('../');

var PORT = 5678;

var mock = hock(PORT, cb(function () {
  mock
    .get('/url')
      .reply(200, { 'hock': 'ok' });

  request('http://localhost:' + PORT + '/url', cb(function (err, res, body) {
    assert(!err);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(body), { 'hock': 'ok' });
    mock.close();
  }));
}));
