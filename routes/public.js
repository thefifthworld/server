const express = require('express')
const pub = express.Router()
const { isLoggedIn } = require('../auth')

// GET /
pub.get('/', isLoggedIn, async (req, res) => {
  res.render('home', {
    member: req.user,
    meta: {}
  })
})

module.exports = pub
