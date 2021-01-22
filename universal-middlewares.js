const jsonwebtoken = require('jsonwebtoken')
const callAPI = require('./api')
const helpers = require('./helpers')
const config = require('./config')

/**
 * A universal middleware for Express.js that sets up a common view options
 * object called `req.viewOpts`.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to call.
 */

const initViewOpts = (req, res, next) => {
  req.viewOpts = {
    helpers,
    member: null,
    meta: {
      monetization: config.monetization,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
    }
  }
  next()
}

/**
 * A universal middleware for Express.js that decodes the JSON Web Token stored
 * in the `jwt` cookie and saves its contents to `req.viewOpts.member` and
 * `req.user`.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to call.
 */

const getUser = (req, res, next) => {
  if (req.cookies.jwt) {
    req.user = req.viewOpts.member = jsonwebtoken.decode(req.cookies.jwt)
    req.user.reauthEndpoint = `${config.api.root}/members/reauth`
    const expire = new Date(req.user.exp * 1000)
    const now = new Date()
    const diff = expire - now
    const m = Math.floor(diff / 60000)
    const s = Math.floor((diff - (m * 60000)) / 1000)
    const min = m === 1 ? '1 minute' : `${m} minutes`
    const sec = s === 1 ? '1 second' : `${s} seconds`
    const yr = expire.getUTCFullYear()
    const mo = expire.getUTCMonth() + 1
    const dy = expire.getUTCDate()
    const hr = expire.getUTCHours()
    const mn = expire.getUTCMinutes()
    const machine = `${yr}-${mo.toString().padStart(2, '0')}-${dy.toString().padStart(2, '0')}T${hr.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`
    const human = `${hr}:${mn.toString().padStart(2, '0')} UTC`
    const expireIn = m > 0 ? `${min} and ${sec}` : sec
    const expireAt = `<time datetime="${machine}">${human}</time>`
    req.user.sessionExpireMsg = `<p>Your session will expire in ${expireIn}, at ${expireAt}.</p>`
  }
  next()
}

/**
 * A universal middleware for Express.js that renews a JSON Web Token that will
 * expire in ten minutes or less.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to call.
 * @returns {Promise<void>} - A Promise that resolves when the middleware has
 *   been executed.
 */

const renewJWT = async (req, res, next) => {
  if (req.user) {
    const issued = req.user.iat * 1000
    const now = new Date().getTime()
    const minutes = (now - issued) / 60000
    if (minutes > 5) {
      try {
        const resp = await callAPI('POST', '/members/reauth', req.cookies.jwt)
        if (resp.status === 200) {
          res.cookie('jwt', resp.data, { maxAge: 900000 })
        }
      } catch (err) {
        res.clearCookie('jwt')
      }
    }
  }
  next()
}

/**
 * A universal middleware for Express.js that handles the case when the
 * requested page could not be found.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to be called.
 */

const error404 = (req, res, next) => {
  req.viewOpts.meta.antisocial = true
  res.status(404).render('errors/e404', req.viewOpts)
}

/**
 * A universal middleware for Express.js that handles the case when an error is
 * encountered.
 * @param err {Object} - An error object.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to be called.
 */

const error500 = (err, req, res, next) => {
  console.error(err)
  req.viewOpts.meta.antisocial = true
  res.status(500).render('errors/e500', req.viewOpts)
}

module.exports = {
  initViewOpts,
  getUser,
  renewJWT,
  error404,
  error500
}
