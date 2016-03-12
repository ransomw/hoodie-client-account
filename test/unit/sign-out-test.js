var simple = require('simple-mock')
var test = require('tape')

var signOut = require('../../lib/sign-out')

test('signOut()', function (t) {
  t.plan(3)

  simple.mock(signOut.internals, 'request').resolveWith({
    statusCode: 204,
    body: null
  })
  simple.mock(signOut.internals, 'clearSession').callFn(function () {})

  var state = {
    url: 'http://example.com',
    cacheKey: 'cacheKey123',
    account: {
      session: {
        id: 'abc4567'
      },
      username: 'pat'
    },
    emitter: {
      emit: simple.stub()
    }
  }

  signOut(state)

  .then(function (result) {
    t.deepEqual(signOut.internals.request.lastCall.arg, {
      method: 'DELETE',
      url: 'http://example.com/session',
      headers: {
        authorization: 'Bearer abc4567'
      }
    })
    t.deepEqual(signOut.internals.clearSession.lastCall.arg, {
      cacheKey: 'cacheKey123'
    })

    t.is(state.account, undefined, 'unsets account')

    simple.restore()
  })

  .catch(t.error)
})

test('signOut() with request error', function (t) {
  t.plan(1)

  simple.mock(signOut.internals, 'request').rejectWith(new Error('Ooops'))

  signOut({
    account: {
      session: {}
    },
    emitter: {
      emit: simple.stub()
    }
  })

  .then(t.fail.bind(t, 'must reject'))

  .catch(function () {
    t.pass('rejects with error')
  })
})
