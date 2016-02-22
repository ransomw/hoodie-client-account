var nock = require('nock')
var store = require('humble-localstorage')
var test = require('tape')

var AccountAdmin = require('../../admin/index')

var accountsResponse = require('../fixtures/accounts')
// this fixture ought contain:
// 1. an id matching one of the user accounts in the accounts fixture
// 2. a session id distinct from the session ids in all other fixtures
var sessionsResponse = require('../fixtures/sessions')

// test sessions.add()
var makeAddTest = function (admin) {
  return function (t) {
    t.plan(3)
    t.ok(admin.sessions.add, 'sessions.add exists')
    t.is(typeof admin.sessions.add, 'function', 'sessions.add is a function')

    nock('http://localhost:3000')
      .get('/accounts')
      .reply(200, accountsResponse)
      .put(/^\/accounts\/(id)\/sessions$/)
      .reply(201, function (url, requestBody) {
        // iss19 wip
        return sessionsResponse
      })

    admin.sessions.add({
      username: 'pat'
    }).then(function (sessionProperties) {
      t.deepEqual({
        id: sessionProperties.id,
        account: {
          id: sessionProperties.account.id,
          username: sessionProperties.account.username
        }
      }, {
        id: 'sessionid456',
        account: {
          id: 'abc4567',
          username: 'pat'
        }
      }, 'got expected sessionProperties data')
    }).then(function () {
      t.end()
    }).catch(t.error)
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
    t.test('add', makeAddTest(admin))
  }
  t.end()
})
