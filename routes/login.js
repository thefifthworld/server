const express = require('express')
const passport = require('passport')
const login = express.Router()
const { requireLoggedIn } = require('../auth')
const options = { session: false, failureRedirect: '/login' }

/**
 * Express.js middleware that can take the user from Passport.js and save it to
 * our JSON Web Token cookie.
 * @param req {Object} - The Express.js request object.
 * @param res {Object} - The Express.js response object.
 * @param next {function} - The next Express.js function to call.
 */

const setJWTFromUser = (req, res, next) => {
  if (req.user) res.cookie('jwt', req.user, { maxAge: 900000 })
  next()
}

// GET /login
login.get('/login', async (req, res) => {
  req.viewOpts.meta.title = 'Log In'
  res.render('login', req.viewOpts)
})

// POST /login
login.post('/login', (passport.authenticate('local', options)), setJWTFromUser, requireLoggedIn, async (req, res) => {
  res.redirect('/login-route')
})

// GET /login/patreon
// GET /connect/patreon
const patreonLoginPaths = ['/login/patreon', '/connect/patreon']
login.get(patreonLoginPaths, passport.authenticate('patreon'))

// GET /login/patreon/callback
// GET /connect/patreon/callback
const patreonCallbackPaths = ['/login/patreon/callback', '/connect/patreon/callback']
login.get(patreonCallbackPaths, passport.authenticate('patreon', options), setJWTFromUser, requireLoggedIn, async (req, res) => {
  res.redirect('/dashboard')
})

// GET /login/discord
// GET /connect/discord
const discordLoginPaths = ['/login/discord', '/connect/discord']
login.get(discordLoginPaths, passport.authenticate('discord', { scope: [ 'identify' ] }))

// GET /login/discord/callback
// GET /connect/discord/callback
const discordCallbackPaths = ['/login/discord/callback', '/connect/discord/callback']
login.get(discordCallbackPaths, passport.authenticate('discord', options), setJWTFromUser, requireLoggedIn, async (req, res) => {
  res.redirect('/dashboard')
})

// GET /login/google
// GET /connect/google
const googleLoginPaths = ['/login/google', '/connect/google']
login.get(googleLoginPaths, passport.authenticate('google', { scope: [ 'email', 'profile' ] }))

// GET /login/google/callback
// GET /connect/google/callback
const googleCallbackPaths = ['/login/google/callback', '/connect/google/callback']
login.get(googleCallbackPaths, passport.authenticate('google', options), setJWTFromUser, requireLoggedIn, async (req, res) => {
  res.redirect('/dashboard')
})

// GET /login/facebook
// GET /connect/facebook
const facebookLoginPaths = ['/login/facebook', '/connect/facebook']
login.get(facebookLoginPaths, passport.authenticate('facebook', { scope: [ 'email' ] }))

// GET /login/facebook/callback
// GET /connect/facebook/callback
const facebookCallbackPaths = ['/login/facebook/callback', '/connect/facebook/callback']
login.get(facebookCallbackPaths, passport.authenticate('facebook', options), setJWTFromUser, requireLoggedIn, async (req, res) => {
  res.redirect('/dashboard')
})

// GET /login-route
login.get('/login-route', requireLoggedIn, async (req, res) => {
  if (req.user && req.user.nopass) {
    res.redirect('/welcome')
  } else if (req.user) {
    res.redirect('/dashboard')
  }
})

// GET /logout
login.get('/logout', async (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 })
  res.redirect('/login')
})

module.exports = login
