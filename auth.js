const axios = require('axios')
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
    } catch (err) {
      console.error(err)
      done(null, false, errmsg)
    }
  }))
}

/**
 * Express.js middleware that tests if the user is logged in. If she is, saves
 * her data to req.user. If she isn't, redirects to /login.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next middleware to call.
 */

const requireLoggedIn = async (req, res, next) => {
  if (req.user) {
    return next()
  } else {
    return res.status(401).render('login', req.viewOpts)
  }
}

/**
 * Express.js middleware that tests if the user is a logged in administrator.
 * If she isn't, redirect her to /login.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next middleware to call.
 */

const requireAdmin = async (req, res, next) => {
  if (req.user && req.user.admin) {
    return next()
  } else {
    return res.status(401).render('login', req.viewOpts)
  }
}

module.exports = {
  initializePassport,
  requireLoggedIn,
  requireAdmin
}
