var expect = require('chai').expect,
  Slack = require('../lib/slack-winston').Slack,
  nock = require('nock');


var config = {
  webhook_url: 'http://slack.com/',
  channel: '#some-channel',
  username: 'My Logger',
  icon_emoji: ':smiling_imp:',
  message: '{{message}}\n\n```{{meta}}```'
};

describe('Slack', function () {
  var transport;

  beforeEach(function () {
    transport = new Slack(config);
  });

  it('should log to Slack', function(done) {
    nock('http://slack.com')
      .post('/')
      .reply(200);

    transport.log({level: 'info', message: 'TestMessage'}, function(err, res) {
      expect(err).to.be.eq(null);
      expect(res).to.be.eq(true);

      done();
    });
  });

  it('should resend message in rate limit case', function(done) {
    nock('http://slack.com')
      .post('/')
      .reply(429, '', { 'Retry-After': '1' });

    nock('http://slack.com')
      .post('/')
      .reply(200);

    var startedAt = new Date();

    transport.log({level: 'info', message: 'TestMessage'}, function(err, res) {
      expect(err).to.be.eq(null);
      expect(res).to.be.eq(true);

      expect(Date.now() - startedAt.valueOf()).to.be.above(1000 + 500);

      done();
    });
  });

});

require('abstract-winston-transport')({
  name: 'Slack',
  construct: config,
  Transport: Slack
});
