const express = require('express')
const pub = express.Router()

// GET /
pub.get('/', async (req, res) => {
  res.render('home')
})

module.exports = pub
