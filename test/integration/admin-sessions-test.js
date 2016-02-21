var nock = require('nock')
var store = require('humble-localstorage')
var test = require('tape')

var AccountAdmin = require('../../admin/index')

var sessionResponse = require('../fixtures/admin-session')

// test sessions.add()
var makeAddTest = function (sessions) {
  return function (t) {
    t.ok(sessions.add, 'sessions.add exists')
    t.is(typeof sessions.add, 'function', 'sessions.add is a function')

    nock('http://localhost:3000')
      .post('/sessions')
    // 2nd arg to .reply() may be a function (url, requestBody) {...}
      .reply(201, sessionResponse)

    sessions.add({
      username: 'pat'
    }).then(function (sessionProperties) {
      t.deepEqual({
        id: sessionProperties.id,
        account: {
          id: sessionProperties.account.id,
          username: sessionProperties.account.username
        }
      }, {
        id: 'session123',
        // account is always included
        account: {
          id: 'account456',
          username: 'pat@example.com'
        }
      }, 'got expected sessionProperties data')
    })

    t.end()
  }
}

test('admin sessions', function (t) {
  var admin = new AccountAdmin({
    url: 'http://localhost:3000'
  })
  var sessions = admin.sessions

  store.setObject('account_admin', {
    username: 'patmin',
    session: {
      id: 'abc4567'
    }
  })

  t.ok(sessions, 'admin has sessions object')
  if (sessions) {
    t.test('add', makeAddTest(sessions))
  }
  t.end()
})
