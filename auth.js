const axios = require('axios')
const jsonwebtoken = require('jsonwebtoken')
const LocalStrategy = require('passport-local').Strategy
const config = require('./config')

/**
 * Set up Passport.js
 * @param passport {Passport} - A Passport.js instance.
 */

const initializePassport = passport => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'passphrase',
    session: false
  },
  async (email, pass, done) => {
    const errmsg = 'Email/passphrase not found'
    try {
      const res = await axios.post(`${config.api.root}/members/auth`, { email, pass })
      return res.status === 200
        ? done(null, res.data)
        : done(null, false, errmsg)
    } catch {
      done(null, false, errmsg)
    }
  }))
}

/**
 * Express.js middleware that tests if the user is logged in. If she isn't,
 * redirect her to /login.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next middleware to call.
 */

const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    const token = await jsonwebtoken.verify(req.cookies.jwt, config.jwt.secret)
    if (token && token.id) {
      next()
    }
  }
  res.redirect('/login')
}

/**
 * Express.js middleware that tests if the user is a logged in administrator.
 * If she isn't, redirect her to /login.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next middleware to call.
 */

const isAdmin = async (req, res, next) => {
  if (req.cookies.jwt) {
    const token = await jsonwebtoken.verify(req.cookies.jwt, config.jwt.secret)
    if (token && token.id && token.admin) {
      next()
    }
  }
  res.redirect('/login')
}

module.exports = {
  initializePassport,
  isLoggedIn,
  isAdmin
}
