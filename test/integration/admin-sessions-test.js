var nock = require('nock')
var store = require('humble-localstorage')
var test = require('tape')

var AccountAdmin = require('../../admin/index')

var accountsResponse = require('../fixtures/accounts')
var accountsUnauthenticatedResponse = require('../fixtures/accounts-401')
// this fixture ought contain:
// 1. an id matching one of the user accounts in the accounts fixture
// 2. a session id distinct from the session ids in all other fixtures
var sessionsResponse = require('../fixtures/sessions')
var sessionsUnauthenticatedResponse = require('../fixtures/sessions-401')

var makeAddUnauthenticatedTest = function (admin) {
  return function (t) {
    nock('http://localhost:3000')
      .get('/accounts')
      .reply(401, accountsUnauthenticatedResponse)
      .put(/^\/accounts\/(id)\/sessions$/)
      .reply(401, sessionsUnauthenticatedResponse)

    admin.sessions.add({
      username: 'pat'
    }).then(function (res) {
      t.notOk(res, 'expected error on unauthenticated admin')
    }, function (err) {
      t.ok(err, 'got error with unauthenticaed admin session')
      t.equal(err.name, 'UnauthenticatedError',
              'correct error type')
    }).then(function () {
      t.end()
    })
  }
}

var makeAddNoUsernameTest = function (admin) {
  return function (t) {
    admin.sessions.add()
      .then(function (res) {
        t.notOk(res, 'expected error on missing username')
      }, function (err) {
        t.ok(err, 'error on missing username')
        t.equal(err.name, 'Error', 'generic error')
        t.equal(err.message, 'options.username is required',
                'correct error message')
      }).then(function () {
        t.end()
      })
  }
}

var makeAddUnconfirmedTest = function (admin) {
  return function (t) {
    // ??? api spec
    t.notOk(true, 'unimplemented')
    t.end()
  }
}

var makeAddNotFoundTest = function (admin) {
  return function (t) {
    nock('http://localhost:3000')
      .get('/accounts')
      .reply(200, accountsResponse)

    admin.sessions.add({
      username: 'quidjybo' // this username ought not exist in fixtures
    }).then(function (res) {
      t.notOk(res, 'expected error on non-existant username')
    }, function (err) {
      t.ok(err, 'error on non-existant username')
      t.equal(err.name, 'ConnectionError',
              'correct error type on non-existant username')
    }).then(function () {
      t.end()
    })
  }
}

var makeAddConnectionErrorTest = function (admin) {
  return function (t) {
    admin.sessions.add({
      username: 'pat'
    }).then(function (res) {
      t.notOk(res, 'expected error on no connection')
    }, function (err) {
      t.ok(err, 'error on no connection')
      t.equal(err.name, 'ConnectionError',
              'correct error type on no connection')
    }).then(function () {
      t.end()
    })
  }
}

var makeAddOkTest = function (admin) {
  return function (t) {
    nock('http://localhost:3000')
      .get('/accounts')
      .reply(200, accountsResponse)
      .put(/^\/accounts\/(id)\/sessions$/)
      .reply(201, function (url, requestBody) {
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
      // ??? additional checks
    }).then(function () {
      t.end()
    }).catch(t.error)
  }
}

// test sessions.add()
var makeAddTest = function (admin) {
  return function (t) {
    t.ok(admin.sessions.add, 'sessions.add exists')
    t.is(typeof admin.sessions.add, 'function',
         'sessions.add is a function')
    t.test('admin unauthenticated', makeAddUnauthenticatedTest(admin))
    store.setObject('account_admin', {
      username: 'patmin',
      session: {
        id: 'abc4567'
      }
    })
    t.test('no username', makeAddNoUsernameTest(admin))
    t.test('unconfirmed', makeAddUnconfirmedTest(admin))
    t.test('account not found', makeAddNotFoundTest(admin))
    t.test('connection error', makeAddConnectionErrorTest(admin))
    t.test('add ok', makeAddOkTest(admin))
    t.end()
  }
}

test('admin sessions', function (t) {
  var admin = new AccountAdmin({
    url: 'http://localhost:3000'
  })

  var sessions = admin.sessions
  t.ok(sessions, 'admin has sessions object')
  if (sessions) {
    t.test('add', makeAddTest(admin))
  }
  t.end()
})
