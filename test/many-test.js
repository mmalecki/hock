var http = require('http'),
  should = require('should'),
  request = require('request'),
  hock = require('../');

var PORT = 5678;

describe('Hock Multiple Request Tests', function () {

  var hockInstance;
  var httpServer;

  describe("With minimum requests", function () {
    beforeEach(function (done) {
      hockInstance = hock.createHock();
      httpServer = http.createServer(hockInstance.handler).listen(PORT, function(err) {
        should.not.exist(err);
        should.exist(hockInstance);

        done();
      });
    });

    it('should succeed with once', function (done) {
      hockInstance
        .get('/url')
        .once()
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });
        hockInstance.done();
        done();
      });
    });

    it('should fail with min: 2 and a single request', function (done) {
      hockInstance
        .get('/url')
        .min(2)
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });
        (function() {
          hockInstance.done();
        }).should.throw();
        done();
      });
    });

    it('should succeed with min:2 and 2 requests', function (done) {
      hockInstance
        .get('/url')
        .min(2)
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });

        request('http://localhost:' + PORT + '/url', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          JSON.parse(body).should.eql({ 'hock': 'ok' });

          hockInstance.done();
          done();
        });
      });
    });

    it('should succeed with max:2 and 1 request', function (done) {
      hockInstance
        .get('/url')
        .max(2)
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });

        hockInstance.done();
        done();
      });
    });

    it('should succeed with max:2 and 2 requests', function (done) {
      hockInstance
        .get('/url')
        .max(2)
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });

        request('http://localhost:' + PORT + '/url', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          JSON.parse(body).should.eql({ 'hock': 'ok' });

          hockInstance.done();
          done();
        });
      });
    });

    it('should succeed with min:2, max:3 and 2 requests', function (done) {
      hockInstance
        .get('/url')
        .min(2)
        .max(3)
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });

        request('http://localhost:' + PORT + '/url', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          JSON.parse(body).should.eql({ 'hock': 'ok' });

          hockInstance.done();
          done();
        });
      });
    });

    it('should succeed with min:2, max:Infinity and 2 requests', function (done) {
      hockInstance
        .get('/url')
        .min(2)
        .max(Infinity)
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });

        request('http://localhost:' + PORT + '/url', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          JSON.parse(body).should.eql({ 'hock': 'ok' });

          hockInstance.done();
          done();
        });
      });
    });

    it('should succeed with 2 different routes with different min, max values', function (done) {
      hockInstance
        .get('/url')
        .min(2)
        .max(3)
        .reply(200, { 'hock': 'ok' })
        .get('/asdf')
        .once()
        .reply(200, { 'hock': 'ok' });

      request('http://localhost:' + PORT + '/url', function (err, res, body) {
        should.not.exist(err);
        should.exist(res);
        res.statusCode.should.equal(200);
        JSON.parse(body).should.eql({ 'hock': 'ok' });

        request('http://localhost:' + PORT + '/asdf', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          JSON.parse(body).should.eql({ 'hock': 'ok' });

          request('http://localhost:' + PORT + '/url', function (err, res, body) {
            should.not.exist(err);
            should.exist(res);
            res.statusCode.should.equal(200);
            JSON.parse(body).should.eql({ 'hock': 'ok' });

            hockInstance.done();
            done();
          });
        });
      });
    });

    describe('min() and max() with replyWithFile', function () {
      it('should succeed with a single call', function (done) {
        hockInstance
          .get('/url')
          .replyWithFile(200, process.cwd() + '/test/data/hello.txt');

        request('http://localhost:' + PORT + '/url', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          body.should.equal('this\nis\nmy\nsample\n');
          hockInstance.done(function (err) {
            should.not.exist(err);
            done();
          });
        });
      });

      it('should succeed with a multiple calls', function (done) {
        hockInstance
          .get('/url')
          .twice()
          .replyWithFile(200, process.cwd() + '/test/data/hello.txt');

        request('http://localhost:' + PORT + '/url', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          body.should.equal('this\nis\nmy\nsample\n');

          request('http://localhost:' + PORT + '/url', function (err, res, body) {
            should.not.exist(err);
            should.exist(res);
            res.statusCode.should.equal(200);
            body.should.equal('this\nis\nmy\nsample\n');
            hockInstance.done(function (err) {
              should.not.exist(err);
              done();
            });
          });
        });
      });
    });

    describe('many()', function() {

      it('should fail with no requests', function (done) {
        hockInstance
          .get('/url')
          .many()
          .reply(200, { 'hock': 'ok' });

          (function() {
            hockInstance.done();
          }).should.throw();
          done();
      })

      it('should succeed with many requests', function (done) {
        hockInstance
          .get('/url')
          .many()
          .reply(200, { 'hock': 'ok' })

        request('http://localhost:' + PORT + '/url', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          JSON.parse(body).should.eql({ 'hock': 'ok' });

          request('http://localhost:' + PORT + '/url', function (err, res, body) {
            should.not.exist(err);
            should.exist(res);
            res.statusCode.should.equal(200);
            JSON.parse(body).should.eql({ 'hock': 'ok' });

            request('http://localhost:' + PORT + '/url', function (err, res, body) {
              should.not.exist(err);
              should.exist(res);
              res.statusCode.should.equal(200);
              JSON.parse(body).should.eql({ 'hock': 'ok' });

              hockInstance.done();
              done();
            });
          });
        });
      });
    });


    describe('any', function() {
      it('should succeed with no requests', function (done) {
        hockInstance
          .get('/url')
          .any()
          .reply(200, { 'hock': 'ok' })
          .done();
          done();
      })

      it('should succeed with many requests', function (done) {
        hockInstance
          .get('/url')
          .any()
          .reply(200, { 'hock': 'ok' });

        request('http://localhost:' + PORT + '/url', function (err, res, body) {
          should.not.exist(err);
          should.exist(res);
          res.statusCode.should.equal(200);
          JSON.parse(body).should.eql({ 'hock': 'ok' });

          request('http://localhost:' + PORT + '/url', function (err, res, body) {
            should.not.exist(err);
            should.exist(res);
            res.statusCode.should.equal(200);
            JSON.parse(body).should.eql({ 'hock': 'ok' });

            request('http://localhost:' + PORT + '/url', function (err, res, body) {
              should.not.exist(err);
              should.exist(res);
              res.statusCode.should.equal(200);
              JSON.parse(body).should.eql({ 'hock': 'ok' });

              hockInstance.done();
              done();
            });
          });
        });
      });
    });

    afterEach(function (done) {
      httpServer.close(done);
    });
  });
});
