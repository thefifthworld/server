const jsonwebtoken = require('jsonwebtoken')
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
    member: null,
    meta: {
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
    }
  }
  next()
}

/**
 * A universal middleware for Express.js that set verifies the JSON Web Token
 * stored in the cookie and saves its payload to `req.user`.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to call.
 * @returns {Promise<void>} - A Promise that resolves when the middleware has
 *   been executed.
 */

const verifyJWT = async (req, res, next) => {
  if (req.cookies.jwt) {
    const token = await jsonwebtoken.verify(req.cookies.jwt, config.jwt.secret)
    req.user = token
    req.viewOpts.member = req.user
  }
  next()
}

/**
 * A universal middleware for Express.js that handles the case when the
 * requested page could not be found.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 */

const error404 = (req, res) => {
  req.viewOpts.meta.antisocial = true
  res.status(404).render('errors/e404', req.viewOpts)
}

/**
 * A universal middleware for Express.js that handles the case when an error is
 * encountered.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 */

const error500 = (err, req, res) => {
  console.error(err)
  req.viewOpts.meta.antisocial = true
  res.status(500).render('errors/e500', req.viewOpts)
}

module.exports = {
  initViewOpts,
  verifyJWT,
  error404,
  error500
}
