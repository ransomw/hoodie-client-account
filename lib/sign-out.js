module.exports = signOut

var clone = require('lodash/clone')
var invokeMap = require('lodash/invokeMap')

var internals = module.exports.internals = {}
internals.request = require('../utils/request')
internals.clearSession = require('../utils/clear-session')
internals.get = require('./get')

function signOut (state) {
  var accountProperties = internals.get(state)

  var preHooks = []
  // note: the `pre:signout` & `post:signout` events are not considered public
  //       APIs and might change in future without notice
  //       https://github.com/hoodiehq/hoodie-client-account/issues/65
  state.emitter.emit('pre:signout', { hooks: preHooks })

  return Promise.resolve()

  .then(function () {
    return Promise.all(invokeMap(preHooks, 'call'))
  })

  .then(function () {
    return internals.request({
      method: 'DELETE',
      url: state.url + '/session',
      headers: {
        authorization: 'Bearer ' + state.account.session.id
      }
    })
  })

  .then(function () {
    internals.clearSession({
      cacheKey: state.cacheKey
    })

    state.emitter.emit('signout', clone(state.account))

    delete state.account

    var postHooks = []

    // note: the `pre:signout` & `post:signout` events are not considered public
    //       APIs and might change in future without notice
    //       https://github.com/hoodiehq/hoodie-client-account/issues/65
    state.emitter.emit('post:signout', { hooks: postHooks })

    return Promise.all(invokeMap(postHooks, 'call'))

    .then(function () {
      return clone(accountProperties)
    })
  })
}
