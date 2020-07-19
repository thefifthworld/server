const express = require('express')
const passport = require('passport')
const login = express.Router()
const { isLoggedIn, requireLoggedIn } = require('../auth')

// GET /login
login.get('/login', isLoggedIn, async (req, res) => {
  res.render('login', {
    member: req.user,
    meta: {
      title: 'Log In'
    }
  })
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
  if (req.user && req.user.email) {
    res.redirect('/dashboard')
  } else if (req.user) {
    res.redirect('/welcome')
  }
})

// GET /dashboard
login.get('/dashboard', requireLoggedIn, async (req, res) => {
  res.render('dashboard', {
    member: req.user,
    meta: {
      title: 'Your Dashboard'
    }
  })
})

// GET /welcome
login.get('/welcome', requireLoggedIn, async (req, res) => {
  res.render('member-form', {
    member: req.user,
    welcome: true,
    meta: {
      title: 'Set Up Your Profile'
    }
  })
})

// GET /logout
login.get('/logout', async (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 })
  res.redirect('/login')
})

module.exports = login
