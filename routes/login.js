const express = require('express')
const passport = require('passport')
const login = express.Router()
const { isLoggedIn } = require('../auth')

// GET /login
login.get('/login', async (req, res) => {
  res.render('login')
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
login.get('/login-route', isLoggedIn, async (req, res) => {
  res.sendStatus(200)
})

// GET /logout
login.get('/logout', async (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 })
  res.redirect('/login')
})

module.exports = login
