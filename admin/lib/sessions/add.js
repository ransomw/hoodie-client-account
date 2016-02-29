module.exports = add

var _ = require('lodash')
// var accountsFind = require('../accounts/find')
var accountsFindAll = require('../accounts/find-all')
var internals = {}
internals.request = require('../../../utils/request')
internals.deserialise = require('../../../utils/deserialise')
internals.serialise = require('../../../utils/serialise')

function add (state, options) {
  // TODO: use accountsFind 而不是 accountsFindAll
  //       after updating accountsFind to match admin README doc
  // return accountsFind(state, {username: options.username})
  return accountsFindAll(state)
    .then(function (response) {
      if (!options || !options.username) {
        throw new Error('options.username is required')
      }

      var account_info = _.filter(
        response, {username: options.username})[0]
      if (!account_info) {
        var not_found_err = new Error('account not found')
        not_found_err.name = 'NotFoundError'
        throw not_found_err
      }

      return internals.request({
        url: state.url + '/accounts/' + account_info.id + '/sessions',
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + state.account.session.id
        }
      })
    }).then(function (response) {
      return internals.deserialise(response.body, options)
    })
}
