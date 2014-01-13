var should = require('should'),
    request = require('request'),
    hock = require('../');

var PORT = 5678;

describe('Hock HTTP Tests', function() {

  var server;

  describe("with available ports", function() {
    before(function(done) {
      hock.createHock(function(err, hockServer) {
        should.not.exist(err);
        should.exist(hockServer);

        server = hockServer;
        done();
      });
    });

    it('should correctly respond to an HTTP GET request', function(done) {
      server
        .get('/url')
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + server.address().port + '/url', function(err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });
        done();

      });
    });

    it('should correctly respond to an HTTP POST request', function (done) {
      server
        .post('/post', { 'hock': 'post' })
        .reply(201, { 'hock': 'created' });

      request({
        uri: 'http://localhost:' + server.address().port + '/post',
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
      server
        .put('/put', { 'hock': 'put' })
        .reply(204, { 'hock': 'updated' });

      request({
        uri: 'http://localhost:' +server.address().port+ '/put',
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

    it('should correctly respond to an HTTP DELETE request', function (done) {
      server
        .delete('/delete')
        .reply(202, { 'hock': 'deleted' });

      request({
        uri: 'http://localhost:' +server.address().port+ '/delete',
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
      server
        .head('/head')
        .reply(200, '', { 'Content-Type': 'plain/text' });

      request({
        uri: 'http://localhost:' +server.address().port+ '/head',
        method: 'HEAD'
      }, function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        should.exist(body);
        body.should.equal('');
        res.headers.should.include({ 'content-type': 'plain/text' });
        done();
      });
    });

    it('unmatched requests should throw', function () {
      server
        .head('/head')
        .reply(200, '', { 'Content-Type': 'plain/text' });

      (function() {
        server.done();
      }).should.throw();
    });

    it('unmatched requests should call done callback with err', function (done) {
      server
        .head('/head')
        .reply(200, '', { 'Content-Type': 'plain/text' })
        .done(function(err) {
          should.exist(err);
          done();
        });
    });
  });

  describe("with hard coded ports", function() {
    before(function(done) {
      hock.createHock(PORT, function(err, hockServer) {
        should.not.exist(err);
        should.exist(hockServer);

        server = hockServer;
        done();
      });
    });

    it('should correctly respond to an HTTP GET request', function(done) {
      server
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

    after(function(done) {
      server.close(done);
    });
  });

  describe("dynamic path replacing / filtering", function() {
    before(function(done) {
      hock.createHock(PORT, function(err, hockServer) {
        should.not.exist(err);
        should.exist(hockServer);

        server = hockServer;
        done();
      });
    });

    it('should correctly use regex', function(done) {
      server
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
      server
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
      server.close(done);
    });
  });
});
