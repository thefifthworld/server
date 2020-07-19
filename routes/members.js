const express = require('express')
const members = express.Router()
const { requireLoggedIn } = require('../auth')

// GET /welcome
members.get('/welcome', requireLoggedIn, async (req, res) => {
  req.viewOpts.welcome = true
  req.viewOpts.meta.title = 'Set Up Your Profile'
  res.render('member-form', req.viewOpts)
})

module.exports = members
