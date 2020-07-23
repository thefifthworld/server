const axios = require('axios')
const LocalStrategy = require('passport-local').Strategy
const PatreonStrategy = require('passport-patreon').Strategy
const DiscordStrategy = require('passport-discord').Strategy
const GoogleStrategy = require('passport-google-oauth2').Strategy
const config = require('./config')

/**
 * Handle OAuth 2.0 authorization requests.
 * @param provider {?string} - The name of the OAuth 2.0 provider (e.g.,
 *   `patreon`, `github`, `facebook`, or `twitter`).
 * @param id {?string} - The OAuth 2.0 token ID.
 * @param token {?string} - The OAuth 2.0 token secret.
 * @param user {?string} - The JSON Web Token of the currently logged-in user.
 * @param done {function} - The callback function.
 * @returns {Promise} - A Promise that resolves when the OAuth 2.0 token has
 *   been authorized, saved to the API, or rejected.
 */

const handleAuth = async (provider, id, token, user, done) => {
  if (user && provider && id) {
    const opts = { headers: { Authorization: `Bearer ${user}` } }
    await axios.post(`${config.api.root}/members/add-auth`, { provider, id, token }, opts)
    return done(null, user)
  } else if (provider && id) {
    const res = await axios.post(`${config.api.root}/members/auth`, { provider, id })
    if (res && res.status === 200) return done(null, res.data)
  }
  return done('Unauthorized')
}

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

  passport.use(new PatreonStrategy({
    clientID: config.patreon.id,
    clientSecret: config.patreon.secret,
    callbackURL: config.patreon.callback,
    passReqToCallback: true
  }, async (req, token, secret, profile, done) => {
    return handleAuth('patreon', profile.id, token, req.user, done)
  }))

  passport.use(new DiscordStrategy({
    clientID: config.discord.id,
    clientSecret: config.discord.secret,
    callbackURL: config.discord.callback,
    passReqToCallback: true
  }, async (req, token, secret, profile, done) => {
    return handleAuth('discord', profile.id, token, req.user, done)
  }))

  passport.use(new GoogleStrategy({
    clientID: config.google.id,
    clientSecret: config.google.secret,
    callbackURL: config.google.callback,
    passReqToCallback: true
  }, async (req, token, secret, profile, done) => {
    return handleAuth('google', profile.id, token, req.user, done)
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
