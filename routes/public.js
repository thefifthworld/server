const express = require('express')
const pub = express.Router()

// GET /
pub.get('/', async (req, res) => {
  res.render('home', {
    member: req.user,
    meta: req.viewOpts.meta
  })
})

module.exports = pub
