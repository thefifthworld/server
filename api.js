const axios = require('axios')
const config = require('./config')

/**
 * Makes a call to the API.
 * @param method {string} - The method used for the API call. (Default: `GET`)
 * @param endpoint {string} - The API endpoint to call.
 * @param jwt {string?} - The logged-in member's JSON Web Token.
 * @param data {Object?} - The object to be sent to the API.
 * @returns {Promise<Object>} - A Promise that resolves with the result of the
 *   API call.
 */

const callAPI = async (method, endpoint, jwt, data) => {
  const opts = jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : {}
  const url = `${config.api.root}${endpoint}`

  let res
  switch (method.toUpperCase()) {
    case 'DELETE': res = await axios.delete(url, opts); break
    case 'POST': res = await axios.post(url, data, opts); break
    case 'PUT': res = await axios.put(url, data, opts); break
    case 'PATCH': res = await axios.patch(url, data, opts); break
    default: res = await axios.get(url, opts); break
  }
  return res
}

module.exports = callAPI
