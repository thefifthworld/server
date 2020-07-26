const express = require('express')
const passport = require('passport')
const login = express.Router()
const callAPI = require('../api')
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

/**
 * Method for accepting an invitation.
 * @param code {string} - The inviation code.
 * @param res {Object} - The Express.js response object.
 * @returns {Promise<void>} - A Promise that resolves when the invitation has
 *   been accepted, the JSON Web Token has been saved as a cookie, and the new
 *   member has been redirected to the welcome page, or by redirecting the
 *   user to the join form if the invitation was not accepted.
 */

const acceptInvitation = async (code, res) => {
  const accept = await callAPI('POST', `/invitations/${code}`)
  if (accept.status === 200) {
    res.cookie('jwt', accept.data, { maxAge: 900000 })
    res.redirect('/welcome')
  } else {
    res.redirect('/join')
  }
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

// GET /join
login.get('/join', (req, res) => {
  req.viewOpts.meta.title = 'Join'
  res.render('join', req.viewOpts)
})

// POST /join
login.post('/join', async (req, res) => {
  await acceptInvitation(req.body.code, res)
})

// GET /join/:code
login.get('/join/:code', async (req, res) => {
  await acceptInvitation(req.params.code, res)
})

// GET /logout
login.get('/logout', async (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 })
  res.redirect('/login')
})

module.exports = login
