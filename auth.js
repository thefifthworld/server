const LocalStrategy = require('passport-local').Strategy
const PatreonStrategy = require('passport-patreon').Strategy
const DiscordStrategy = require('passport-discord').Strategy
const GoogleStrategy = require('passport-google-oauth2').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const callAPI = require('./api')
const config = require('./config')

/**
 * Handle OAuth 2.0 authorization requests.
 * @param provider {?string} - The name of the OAuth 2.0 provider (e.g.,
 *   `patreon`, `github`, `facebook`, or `twitter`).
 * @param id {?string} - The OAuth 2.0 token ID.
 * @param token {?string} - The OAuth 2.0 token secret.
 * @param jwt {?string} - The JSON Web Token of the currently logged-in user.
 * @param done {function} - The callback function.
 * @returns {Promise} - A Promise that resolves when the OAuth 2.0 token has
 *   been authorized, saved to the API, or rejected.
 */

const handleAuth = async (provider, id, token, jwt, done) => {
  if (jwt && provider && id) {
    await callAPI('POST', '/members/providers', jwt, { provider, id, token })
    return done(null, jwt)
  } else if (provider && id) {
    try {
      const res = await callAPI('POST', '/members/auth', null, { provider, id })
      if (res && res.status === 200) return done(null, res.data)
    } catch (err) {
      return done(null, false, err)
    }
  }
  return done(null, false, 'Unauthorized')
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
      const res = await callAPI('POST', '/members/auth', null, { email, pass })
      return res.status === 200
        ? done(null, res.data)
        : done(null, false, errmsg)
    } catch (err) {
      done(null, false, errmsg)
    }
  }))

  passport.use(new PatreonStrategy({
    clientID: config.patreon.id,
    clientSecret: config.patreon.secret,
    callbackURL: config.patreon.callback,
    passReqToCallback: true
  }, async (req, token, secret, profile, done) => {
    return handleAuth('patreon', profile.id, token, req.cookies.jwt, done)
  }))

  passport.use(new DiscordStrategy({
    clientID: config.discord.id,
    clientSecret: config.discord.secret,
    callbackURL: config.discord.callback,
    passReqToCallback: true
  }, async (req, token, secret, profile, done) => {
    return handleAuth('discord', profile.id, token, req.cookies.jwt, done)
  }))

  passport.use(new GoogleStrategy({
    clientID: config.google.id,
    clientSecret: config.google.secret,
    callbackURL: config.google.callback,
    passReqToCallback: true
  }, async (req, token, secret, profile, done) => {
    return handleAuth('google', profile.id, token, req.cookies.jwt, done)
  }))

  passport.use(new FacebookStrategy({
    clientID: config.facebook.id,
    clientSecret: config.facebook.secret,
    callbackURL: config.facebook.callback,
    passReqToCallback: true
  }, async (req, token, secret, profile, done) => {
    return handleAuth('facebook', profile.id, token, req.cookies.jwt, done)
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
    req.viewOpts.sessionExpireMsg = req.user.sessionExpireMsg
    req.viewOpts.reauthEndpoint = req.user.reauthEndpoint
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

/**
 * A middleware for Express.js that checks if the logged-in user has any
 * messages. If so, they are attached to the view options object.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next function to call.
 * @returns {Promise<void>} - A Promise that resolves when the middleware has
 *   been executed.
 */

const checkMessages = async (req, res, next) => {
  req.viewOpts.messages = []
  if (req.user) {
    const messages = await callAPI('GET', '/members/messages', req.cookies.jwt)
    if (messages.status === 200) {
      const arr = []
      const { data } = messages
      if (data.confirmation) data.confirmation.forEach(msg => { arr.push({ cls: 'confirm', msg }) })
      if (data.error) data.error.forEach(msg => { arr.push({ cls: 'error', msg }) })
      if (data.warning) data.warning.forEach(msg => { arr.push({ cls: 'warning', msg }) })
      if (data.info) data.info.forEach(msg => { arr.push({ msg }) })
      req.viewOpts.messages = arr
    }
  }
  next()
}

module.exports = {
  initializePassport,
  requireLoggedIn,
  requireAdmin,
  checkMessages
}
