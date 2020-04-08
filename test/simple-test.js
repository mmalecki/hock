var http = require('http'),
    url = require('url'),
    should = require('should'),
    shouldHttp = require('should-http'),
    request = require('request'),
    hock = require('../');

var PORT = 5678;

describe('Hock HTTP Tests', function() {

  var hockInstance;
  var httpServer;

  describe("with available ports", function() {
    before(function(done) {
      hockInstance = hock.createHock();
      httpServer = http.createServer(hockInstance.handler).listen(PORT, function(err) {
        should.not.exist(err);
        should.exist(hockInstance);

        done();
      });
    });

    it('should correctly respond to an HTTP GET request', function(done) {
      hockInstance
        .get('/url')
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function(err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });
        done();

      });
    });

    it('should correctly respond to an HTTP POST request', function (done) {
      hockInstance
        .post('/post', { 'hock': 'post' })
        .reply(201, { 'hock': 'created' });

      request({
        uri: 'http://localhost:' + PORT + '/post',
        method: 'POST',
        json: {
          'hock': 'post'
        }
      }, function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(201);
        body.should.eql({ 'hock': 'created' });
        done();
      });
    });

    it('should correctly respond to an HTTP PUT request', function (done) {
      hockInstance
        .put('/put', { 'hock': 'put' })
        .reply(204, { 'hock': 'updated' });

      request({
        uri: 'http://localhost:' + PORT + '/put',
        method: 'PUT',
        json: {
          'hock': 'put'
        }
      }, function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(204);
        should.not.exist(body);
        done();
      });
    });

    it('should correctly respond to an HTTP PATCH request', function (done) {
      hockInstance
        .patch('/patch', { 'hock': 'patch' })
        .reply(204, { 'hock': 'updated' });

      request({
        uri: 'http://localhost:' + PORT + '/patch',
        method: 'PATCH',
        json: {
          'hock': 'patch'
        }
      }, function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(204);
        should.not.exist(body);
        done();
      });
    });

    it('should correctly respond to an HTTP DELETE request', function (done) {
      hockInstance
        .delete('/delete')
        .reply(202, { 'hock': 'deleted' });

      request({
        uri: 'http://localhost:' + PORT + '/delete',
        method: 'DELETE'
      }, function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(202);
        should.exist(body);
        JSON.parse(body).should.eql({ 'hock': 'deleted' });
        done();
      });
    });

    it('should correctly respond to an HTTP HEAD request', function (done) {
      hockInstance
        .head('/head')
        .reply(200, '', { 'Content-Type': 'plain/text' });

      request({
        uri: 'http://localhost:' + PORT + '/head',
        method: 'HEAD'
      }, function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        should.exist(body);
        body.should.equal('');
        res.should.have.header('content-type', 'plain/text');
        done();
      });
    });

    it('should correctly respond to an HTTP COPY request', function(done) {
      hockInstance
        .copy('/copysrc')
        .reply(204);

      request({
        uri: 'http://localhost:' + PORT + '/copysrc',
        method: 'COPY'
      }, function(err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(204);
        body.should.equal('');
        done();
      });
    });

    it('unmatched requests should throw', function () {
      hockInstance
        .head('/head')
        .reply(200, '', { 'Content-Type': 'plain/text' });

      (function() {
        hockInstance.done();
      }).should.throw();
    });

    it('unmatched requests should call done callback with err', function (done) {
      hockInstance
        .head('/head')
        .reply(200, '', { 'Content-Type': 'plain/text' })
        .done(function(err) {
          should.exist(err);
          done();
        });
    });

    it('should work with a delay configured', function(done) {
      const DELAY = 500

      hockInstance
        .get('/url')
        .delay(DELAY)
        .reply(200, { 'hock': 'ok' });

      const start = Date.now()
      request('http://localhost:' + PORT + '/url', function(err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });
        (Date.now() - start).should.be.aboveOrEqual(DELAY);
        done();

      });
    });

    it('should work with response body function', function(done) {
      hockInstance
        .get('/url?key=value')
        .reply(200, function(request) {
          const query = url.parse(request.url, true).query;
          return { 'hock': 'ok', key: query.key };
        });

      request('http://localhost:' + PORT + '/url?key=value', function(err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok', key: 'value' });

        done();
      });
    });

    it('should work with response header function', function(done) {
      hockInstance
        .get('/url?key=value')
        .reply(200, { 'hock': 'ok' }, function(request) {
          const query = url.parse(request.url, true).query;
          return {
            'x-request-key': query.key,
          };
        });

      request('http://localhost:' + PORT + '/url?key=value', function(err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);

        res.headers['x-request-key'].should.eql('value');

        done();
      });
    });

    after(function (done) {
      httpServer.close(done);
    });
  });

  describe("dynamic path replacing / filtering", function() {
    before(function(done) {
      hockInstance = hock.createHock();
      httpServer = http.createServer(hockInstance.handler).listen(PORT, function(err) {
        should.not.exist(err);
        should.exist(hockInstance);

        done();
      });
    });

    it('should correctly use regex', function(done) {
      hockInstance
        .filteringPathRegEx(/password=[^&]*/g, 'password=XXX')
        .get('/url?password=XXX')
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url?password=artischocko', function(err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });
        done();

      });
    });

    it('should correctly use functions', function(done) {
      hockInstance
        .filteringPath(function (p) {
          p.should.equal('/url?password=artischocko');
          return '/url?password=XXX';
        })
        .get('/url?password=XXX')
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url?password=artischocko', function(err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });
        done();

      });
    });

    after(function(done) {
      httpServer.close(done);
    });
  });

  describe("test if route exists", function() {
    before(function(done) {
      hockInstance = hock.createHock();
      httpServer = http.createServer(hockInstance.handler).listen(PORT, function (err) {
        should.not.exist(err);
        should.exist(hockInstance);

        done();
      });
    });

    it('should allow testing for url', function(done) {
      hockInstance
        .get('/url?password=foo')
        .reply(200, { 'hock': 'ok' })
        .get('/arti')
        .reply(200, { 'hock': 'ok' });

      hockInstance.hasRoute('GET', '/url?password=foo').should.equal(true);
      hockInstance.hasRoute('GET', '/arti').should.equal(true);
      hockInstance.hasRoute('GET', '/notexist').should.equal(false);
      done();
    });

    it('matches the header', function(done) {
      hockInstance
        .get('/url?password=foo')
        .reply(200, { 'hock': 'ok' })
        .get('/artischocko', { 'foo-type': 'artischocke' })
        .reply(200, { 'hock': 'ok' });

      hockInstance
        .hasRoute('GET', '/bla?password=foo', null, { 'content-type': 'plain/text' })
        .should.equal(false);
      hockInstance
        .hasRoute('GET', '/artischocko', null, { 'foo-type': 'artischocke' })
        .should.equal(true);

      done();
    });

    it('matches the body', function(done) {
      hockInstance
        .get('/url?password=foo')
        .reply(200, { 'hock': 'ok' })
        .post('/artischocko', 'enteente')
        .reply(200, { 'hock': 'ok' });

      hockInstance.hasRoute('GET', '/bla?password=foo', 'testing').should.equal(false);
      hockInstance.hasRoute('POST', '/artischocko', 'enteente').should.equal(true);

      done();
    });

    it('matches different order of querystring parameters', function(done) {
      hockInstance
        .get('/url?user=foo&pass=bar')
        .reply(200, { 'hock': 'ok' });

      hockInstance.hasRoute('GET', '/url?pass=bar&user=foo').should.equal(true);
      done();
    });

    after(function(done) {
      httpServer.close(done);
    });
  });
});
