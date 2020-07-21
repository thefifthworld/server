const express = require('express')
const passport = require('passport')
const login = express.Router()
const { requireLoggedIn } = require('../auth')

// GET /login
login.get('/login', async (req, res) => {
  req.viewOpts.meta.title = 'Log In'
  res.render('login', req.viewOpts)
})

// POST /login
login.post('/login', (passport.authenticate('local', { session: false })), async (req, res) => {
  if (req.user) {
    res.cookie('jwt', req.user, { maxAge: 900000 })
    res.redirect('/login-route')
  } else {
    res.redirect('/login')
  }
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
