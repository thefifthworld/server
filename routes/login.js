const express = require('express')
const passport = require('passport')
const login = express.Router()
const { requireLoggedIn } = require('../auth')

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
login.post('/login', (passport.authenticate('local', { session: false })), setJWTFromUser, requireLoggedIn, async (req, res) => {
  res.redirect('/login-route')
})

// GET /login/patreon
// GET /connect/patreon
const patreonLoginPaths = ['/login/patreon', '/connect/patreon']
login.get(patreonLoginPaths, passport.authenticate('patreon'))

// GET /login/patreon/callback
// GET /connect/patreon/callback
const patreonCallbackPaths = ['/login/patreon/callback', '/connect/patreon/callback']
login.get(patreonCallbackPaths, passport.authenticate('patreon', {  session: false }), setJWTFromUser, requireLoggedIn, async (req, res) => {
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

// GET /dashboard
login.get('/dashboard', requireLoggedIn, async (req, res) => {
  req.viewOpts.meta.title = 'Your Dashboard'
  res.render('dashboard', req.viewOpts)
})

// GET /logout
login.get('/logout', async (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 })
  res.redirect('/login')
})

module.exports = login
